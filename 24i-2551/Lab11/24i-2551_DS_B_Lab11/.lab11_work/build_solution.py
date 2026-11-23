from pathlib import Path
import nbformat as nbf
import textwrap

ROOT = Path(__file__).resolve().parents[1]
cells = []
def md(s): cells.append(nbf.v4.new_markdown_cell(textwrap.dedent(s).strip()))
def code(s): cells.append(nbf.v4.new_code_cell(textwrap.dedent(s).strip()))

md('''
# Lab 11 — Text Analysis and Visualization
**Dataset:** `Tweets.csv` (keep beside this notebook).  
**Written answers:** `Lab11_Explanations.txt`. Markdown cells identify each task; explanations, judgments, and the Director's brief are in the separate text file.
''')
md('## Setup — Libraries and dataset')
code('''
import importlib.util
import subprocess
import sys

packages = {'pandas': 'pandas', 'numpy': 'numpy', 'matplotlib': 'matplotlib',
            'seaborn': 'seaborn', 'sklearn': 'scikit-learn', 'nltk': 'nltk',
            'wordcloud': 'wordcloud'}
missing = [package for module, package in packages.items()
           if importlib.util.find_spec(module) is None]
if missing:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', *missing])

import html
import re
from pathlib import Path
from collections import Counter
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter
import seaborn as sns
import nltk
from nltk.tokenize import TweetTokenizer
from nltk.corpus import stopwords, wordnet
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.sentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, cohen_kappa_score,
                             classification_report, confusion_matrix, f1_score)
from wordcloud import WordCloud
from IPython.display import display

for resource in ['stopwords', 'wordnet', 'omw-1.4', 'vader_lexicon',
                 'averaged_perceptron_tagger_eng']:
    if not nltk.download(resource, quiet=True):
        raise RuntimeError(f'Could not download NLTK resource: {resource}')

pd.set_option('display.max_colwidth', 150)
pd.set_option('display.max_columns', 20)
sns.set_theme(style='whitegrid', context='notebook')
plt.rcParams.update({'figure.dpi': 110, 'axes.titlesize': 12})
LABELS = ['negative', 'neutral', 'positive']
COLORS = {'negative': '#C44E52', 'neutral': '#8A9299', 'positive': '#319270'}
source = Path('Tweets.csv')
if not source.exists():
    raise FileNotFoundError('Put Tweets.csv in the same working folder as this notebook.')
raw = pd.read_csv(source, dtype={'tweet_id': 'string'})
required = {'tweet_id', 'text', 'airline', 'airline_sentiment',
            'airline_sentiment_confidence', 'negativereason', 'tweet_created'}
assert required.issubset(raw.columns)
duplicate_rows = raw[raw['tweet_id'].duplicated(keep=False)]
conflicting_ids = (duplicate_rows.groupby('tweet_id')['airline_sentiment'].nunique() > 1).sum()
df = (raw.dropna(subset=['tweet_id', 'text', 'airline_sentiment', 'airline'])
      .sort_values('airline_sentiment_confidence', ascending=False, kind='stable')
      .drop_duplicates('tweet_id', keep='first').sort_index().copy())
df = df[df['text'].str.strip().ne('')].copy()
df['created_utc'] = pd.to_datetime(df['tweet_created'], utc=True, errors='coerce')
df['retweet_count'] = pd.to_numeric(df['retweet_count'], errors='coerce').fillna(0)
display(pd.Series({'Original rows': len(raw), 'Unique usable tweets': len(df),
                   'Repeated tweet IDs removed': raw.tweet_id.duplicated().sum(),
                   'Repeated IDs with conflicting labels': int(conflicting_ids),
                   'Invalid timestamps': df.created_utc.isna().sum()}, name='Dataset audit').to_frame())
display(df[['airline', 'airline_sentiment', 'text']].head())

sia = SentimentIntensityAnalyzer()
def sentiment_label(score):
    return 'positive' if score >= 0.05 else ('negative' if score <= -0.05 else 'neutral')
def compound(text):
    return sia.polarity_scores(str(text))['compound']
''')

md('## Part A — Preparing tweet text\n### A1 — Tweet features, naive tokenization, and treatment')
code(r'''
tweet_tokenizer = TweetTokenizer(preserve_case=True, reduce_len=False, strip_handles=False)
feature_patterns = {
    'Handle': r'@\w+', 'Hashtag': r'#\w+', 'URL': r'https?://\S+',
    'Emoji / emoticon': r'[\U0001F300-\U0001FAFF]|[:;]-?[)(DP]',
    'Stretched word': r'([a-zA-Z])\1{2,}'
}
examples = []
for feature, pattern in feature_patterns.items():
    candidates = df.loc[df.text.map(lambda text: bool(re.search(pattern, text, flags=re.I))), 'text']
    example = candidates.iloc[0] if len(candidates) else 'No example found'
    examples.append({'feature': feature, 'tweets containing feature': len(candidates),
                     'example': example, 'naive regex tokens': re.findall(r'\b\w+\b', example),
                     'tweet-aware tokens': tweet_tokenizer.tokenize(example)})
feature_table = pd.DataFrame(examples)
display(feature_table)

demo = '@Airline soooo happy :) #NotHappy https://example.com ✈️ 😡'
display(pd.DataFrame({'method': ['Whitespace', 'Naive word regex', 'TweetTokenizer'],
                      'tokens': [demo.split(), re.findall(r'\b\w+\b', demo),
                                 tweet_tokenizer.tokenize(demo)]}))
feature_policy = pd.DataFrame([
    ('Handles', 'Remove for topics; keep original text for VADER'),
    ('Hashtags', 'Remove # but retain the word; leave compound hashtags unsplit'),
    ('Links', 'Remove for topics; keep original text for VADER'),
    ('Emoji / emoticons', 'Keep in raw sentiment input; exclude from alphabetic topic counts'),
    ('Stretched words', 'Reduce 3+ repeated letters to 2 for topics; preserve raw for VADER'),
    ('Case and punctuation', 'Lowercase / filter for topics; preserve raw sentiment input')
], columns=['feature', 'treatment'])
display(feature_policy)

def without_noise(text):
    text = html.unescape(str(text))
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    text = re.sub(r'@\w+', ' ', text)
    return re.sub(r'#(\w+)', r'\1', text)

stage_tokens = {}
stage_tokens['1 Raw tweet-aware tokens'] = df.text.map(tweet_tokenizer.tokenize)
stage_tokens['2 Remove handles/URLs; decode HTML; strip #'] = df.text.map(
    lambda x: tweet_tokenizer.tokenize(without_noise(x)))
stage_tokens['3 Lowercase'] = stage_tokens[list(stage_tokens)[-1]].map(
    lambda ts: [t.lower() for t in ts])
stage_tokens['4 Reduce stretched letters'] = stage_tokens[list(stage_tokens)[-1]].map(
    lambda ts: [re.sub(r'([a-z])\1{2,}', r'\1\1', t) for t in ts])
stage_tokens['5 Alphabetic words / contractions'] = stage_tokens[list(stage_tokens)[-1]].map(
    lambda ts: [t for t in ts if re.fullmatch(r"[a-z]+(?:'[a-z]+)?", t)])
word_tokens = stage_tokens[list(stage_tokens)[-1]]
display(pd.DataFrame({'original': df.text.head(5), 'topic tokens': word_tokens.head(5)}))
''')

md('### A2 — Negation and stop-word sensitivity')
code('''
standard_stop = set(stopwords.words('english'))
negations = {'no', 'not', 'nor', 'never', 'neither', 'nothing', 'nobody', 'nowhere',
             'cannot', "can't", "won't", "don't", "didn't", "isn't", "wasn't",
             "doesn't", "couldn't", "wouldn't", "shouldn't", "haven't", "hasn't",
             "hadn't", "aren't", "weren't", "mustn't"}
final_stop = (standard_stop - negations) | {'rt', 'amp', 'http', 'https', 'co'}
display(pd.DataFrame({'standard_stop_contains': [w in standard_stop for w in ['not','no','nor']],
                     'final_stop_contains': [w in final_stop for w in ['not','no','nor']]},
                    index=['not','no','nor']))

def stopword_version(text, stops):
    return ' '.join(t for t in tweet_tokenizer.tokenize(text) if t.lower() not in stops)
negation_examples = ['The service is not good.', 'No help at the airport.',
                     'The flight was not bad.', 'Neither helpful nor polite.']
negation_demo = pd.DataFrame({'original': negation_examples})
negation_demo['standard removal'] = negation_demo.original.map(lambda x: stopword_version(x, standard_stop))
negation_demo['negation retained'] = negation_demo.original.map(lambda x: stopword_version(x, final_stop))
for column in ['original', 'standard removal', 'negation retained']:
    negation_demo[column + ' score'] = negation_demo[column].map(compound)
display(negation_demo)

raw['vader_compound'] = raw.text.map(compound)
raw['vader_label'] = raw.vader_compound.map(sentiment_label)
df['vader_compound'] = raw.loc[df.index, 'vader_compound']
df['vader_label'] = raw.loc[df.index, 'vader_label']
standard_scores = df.text.map(lambda x: compound(stopword_version(x, standard_stop)))
retained_scores = df.text.map(lambda x: compound(stopword_version(x, final_stop)))
ablation = pd.DataFrame({
    'Raw tweets (final sentiment input)': df.vader_compound.map(sentiment_label),
    'Standard stop-word removal': standard_scores.map(sentiment_label),
    'Negation-preserving removal': retained_scores.map(sentiment_label)
})
ablation_metrics = pd.DataFrame([
    {'input': col, 'accuracy': accuracy_score(df.airline_sentiment, ablation[col]),
     'macro F1': f1_score(df.airline_sentiment, ablation[col], labels=LABELS, average='macro'),
     'predictions changed from raw': (ablation[col] != df.vader_label).sum()}
    for col in ablation
]).set_index('input')
display(ablation_metrics.round(4))
stage_tokens['6 Remove stop words; retain negation'] = word_tokens.map(
    lambda ts: [t for t in ts if t not in final_stop])
''')

md('### A3 — Stemming versus POS-aware lemmatization')
code('''
stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()
def wordnet_pos(tag):
    return {'J': wordnet.ADJ, 'V': wordnet.VERB, 'N': wordnet.NOUN,
            'R': wordnet.ADV}.get(tag[0], wordnet.NOUN)

tagged = nltk.pos_tag_sents(word_tokens.tolist())
lemma_all = pd.Series([
    [lemmatizer.lemmatize(w, wordnet_pos(pos)) for w, pos in sentence]
    for sentence in tagged
], index=df.index)
tokens_before_base = stage_tokens['6 Remove stop words; retain negation']
stem_tokens = tokens_before_base.map(lambda ts: [stemmer.stem(t) for t in ts])
lemma_tokens = pd.Series([
    [lemmatizer.lemmatize(w, wordnet_pos(pos)) for w, pos in sentence if w not in final_stop]
    for sentence in tagged
], index=df.index)
vocab_size = lambda series: len({w for tokens in series for w in tokens})
vocabulary_sizes = pd.Series({'Before base reduction': vocab_size(tokens_before_base),
                              'Porter stemming': vocab_size(stem_tokens),
                              'POS-aware lemmatization': vocab_size(lemma_tokens)}, name='Unique words')
display(vocabulary_sizes.to_frame())
vocabulary_comparison = Counter((w, stemmer.stem(w), lemmatizer.lemmatize(w, wordnet_pos(pos)))
                               for sentence in tagged for w, pos in sentence
                               if w not in final_stop)
comparison = pd.DataFrame([(*key, count) for key, count in vocabulary_comparison.items()],
                          columns=['word', 'stem', 'lemma', 'occurrences'])
display(comparison[comparison.stem.ne(comparison.lemma)]
        .sort_values('occurrences', ascending=False).head(20).reset_index(drop=True))
stage_tokens['7 POS-aware lemmatization'] = lemma_tokens
''')

md('### A4 — Loss at every cleaning step')
code('''
airline_words = {'united', 'usairways', 'americanair', 'american', 'airlines', 'airline',
                 'southwest', 'southwestair', 'delta', 'jetblue', 'virgin',
                 'virginamerica', 'america', 'airways'}
topic_filler = {'u', 'us', 'please', 'im', 'ive', 'youre'}
stage_tokens['8 Remove airline names and generic filler'] = lemma_tokens.map(
    lambda ts: [t for t in ts if t not in airline_words and t not in final_stop and t not in topic_filler])
stage_tokens['9 Exclude nonword artifact flightled'] = stage_tokens[list(stage_tokens)[-1]].map(
    lambda ts: [t for t in ts if t != 'flightled'])
df['tokens'] = stage_tokens[list(stage_tokens)[-1]]
df['clean_text'] = df.tokens.map(' '.join)
audit_rows = []
for name, series in stage_tokens.items():
    lengths = series.map(len)
    audit_rows.append({'step': name, 'vocabulary': vocab_size(series),
                       'total tokens': lengths.sum(), 'mean tokens/tweet': lengths.mean(),
                       'median tokens/tweet': lengths.median(), 'empty tweets': lengths.eq(0).sum()})
cleaning_audit = pd.DataFrame(audit_rows).set_index('step')
cleaning_audit['vocabulary change from previous'] = cleaning_audit.vocabulary.diff()
cleaning_audit['tokens lost from previous'] = -cleaning_audit['total tokens'].diff()
display(cleaning_audit.round(2))
fig, axes = plt.subplots(1, 3, figsize=(15, 4))
for ax, col in zip(axes, ['vocabulary', 'mean tokens/tweet', 'empty tweets']):
    ax.plot(range(1, len(cleaning_audit)+1), cleaning_audit[col], marker='o')
    ax.set(xlabel='Cleaning step (table above)', ylabel=col, title=col.capitalize())
    ax.set_xticks(range(1, len(cleaning_audit)+1))
plt.tight_layout(); plt.show()
display(df.loc[df.clean_text.eq(''), ['text', 'airline_sentiment']].head(8))
''')

md('## Part B — Words, distinctive vocabulary, and phrases\n### B1 — Raw dominance and cleaned word frequencies')
code('''
def word_counts(series):
    return Counter(w for tokens in series for w in tokens)
def top_bar(counter, ax, title, n=15, color='#4179A3', xlabel='Token occurrences'):
    data = pd.Series(dict(counter.most_common(n))).sort_values()
    ax.barh(data.index, data.values, color=color)
    ax.set(title=title, xlabel=xlabel)

raw_counts = word_counts(stage_tokens['1 Raw tweet-aware tokens'].map(
    lambda ts: [t.lower() for t in ts]))
clean_counts = word_counts(df.tokens)
fig, axes = plt.subplots(1, 2, figsize=(14, 6))
top_bar(raw_counts, axes[0], 'Raw tokens: names, handles, punctuation and filler')
top_bar(clean_counts, axes[1], 'Cleaned topic words')
plt.tight_layout(); plt.show()
display(pd.DataFrame(raw_counts.most_common(15), columns=['raw token', 'count']))
display(pd.Series({'Tweets containing a handle (%)': 100*df.text.str.contains(r'@\\w+', regex=True).mean(),
                   'Tweets containing an airline handle (%)': 100*df.text.str.contains(
                       r'@(?:united|usairways|americanair|southwestair|jetblue|virginamerica)\\b',
                       case=False, regex=True).mean()}).round(2).to_frame('value'))
''')

md('### B2 — Distinctive positive and negative words: TF-IDF and normalized butterfly bars')
code('''
polar = df[df.airline_sentiment.isin(['positive', 'negative'])].copy()
tfidf = TfidfVectorizer(tokenizer=str.split, preprocessor=None, token_pattern=None,
                        lowercase=False, min_df=5)
X_tfidf = tfidf.fit_transform(polar.clean_text)
terms = tfidf.get_feature_names_out()
mean_tfidf = pd.DataFrame({label: np.asarray(X_tfidf[
    polar.airline_sentiment.eq(label).to_numpy()].mean(axis=0)).ravel()
    for label in ['negative', 'positive']}, index=terms)
mean_tfidf['negative minus positive'] = mean_tfidf.negative - mean_tfidf.positive
negative_distinctive = mean_tfidf.nlargest(12, 'negative minus positive')
positive_distinctive = mean_tfidf.nsmallest(12, 'negative minus positive')
display(negative_distinctive.round(5)); display(positive_distinctive.round(5))
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for ax, data, label in [(axes[0], negative_distinctive, 'negative'),
                         (axes[1], positive_distinctive, 'positive')]:
    values = data['negative minus positive'].abs().sort_values()
    ax.barh(values.index, values, color=COLORS[label])
    ax.set(title=f'Distinctive {label} words', xlabel='Absolute difference in mean tweet TF-IDF')
plt.tight_layout(); plt.show()

group_counts = {s: word_counts(df.loc[df.airline_sentiment.eq(s), 'tokens'])
                for s in ['negative', 'positive']}
shared_words = [word for word, _ in (group_counts['negative'] + group_counts['positive']).most_common(15)]
butterfly = pd.DataFrame({s: [1000*group_counts[s][w]/sum(group_counts[s].values())
                            for w in shared_words] for s in group_counts}, index=shared_words)
fig, ax = plt.subplots(figsize=(10, 6))
ax.barh(butterfly.index, -butterfly.negative, color=COLORS['negative'], label='Negative')
ax.barh(butterfly.index, butterfly.positive, color=COLORS['positive'], label='Positive')
limit = butterfly.to_numpy().max()*1.12
ax.set_xlim(-limit, limit)
ax.axvline(0, color='black', lw=0.8)
ax.xaxis.set_major_formatter(FuncFormatter(lambda value, _: f'{abs(value):.0f}'))
ax.set(title='Word frequencies adjusted for unequal group sizes', xlabel='Occurrences per 1,000 topic tokens')
ax.legend(); plt.tight_layout(); plt.show()
''')

md('### B3 — Negative bigrams, trigrams, operational problems, and negation')
code(r'''
negative = df[df.airline_sentiment.eq('negative')].copy()
negative_mask = df.airline_sentiment.eq('negative')
# Keep stop words and word order to avoid inventing phrases across removed words.
phrase_documents = word_tokens.loc[negative.index].map(' '.join)
def ngram_counts(documents, n):
    vectorizer = CountVectorizer(tokenizer=str.split, preprocessor=None, token_pattern=None,
                                 lowercase=False, ngram_range=(n, n), min_df=3)
    matrix = vectorizer.fit_transform(documents)
    counts = np.asarray(matrix.sum(axis=0)).ravel()
    return Counter(dict(zip(vectorizer.get_feature_names_out(), counts)))
bigrams = ngram_counts(phrase_documents, 2)
trigrams = ngram_counts(phrase_documents, 3)
fig, axes = plt.subplots(1, 2, figsize=(15, 6))
top_bar(bigrams, axes[0], 'Negative tweets: adjacent bigrams', color=COLORS['negative'])
top_bar(trigrams, axes[1], 'Negative tweets: adjacent trigrams', color=COLORS['negative'])
plt.tight_layout(); plt.show()
operational_patterns = {'Cancelled flight': r'\b(?:cancelled|canceled) flights?\b|\bflights? (?:was |is |got |has been )?(?:cancelled|canceled)\b',
                        'Lost luggage': r'\blost (?:my |our |the )?(?:luggage|bags?|baggage)\b',
                        'On hold': r'\bon hold\b'}
operational_evidence = []
for phrase, pattern in operational_patterns.items():
    mask = negative.text.str.contains(pattern, case=False, regex=True)
    operational_evidence.append({'problem phrase': phrase, 'negative tweets matching': mask.sum(),
                                 'example': negative.loc[mask, 'text'].iloc[0] if mask.any() else ''})
operational_evidence = pd.DataFrame(operational_evidence)
display(operational_evidence)
flip_mask = negative.text.str.contains(r'\bnot (?:good|happy|helpful|impressed|pleased)\b', case=False, regex=True)
display(negative.loc[flip_mask, ['text', 'airline_sentiment']].head(8))
flip_scores = pd.DataFrame({'text': ['good', 'not good', 'happy', 'not happy']})
flip_scores['VADER compound'] = flip_scores.text.map(compound)
display(flip_scores)
''')

md('### B4 — Matched negative-word cloud and bar chart')
code('''
negative_words = group_counts['negative']
matched_words = dict(negative_words.most_common(30))
cloud = WordCloud(width=1200, height=700, background_color='white',
                  colormap='Reds', random_state=11, collocations=False,
                  relative_scaling=1).generate_from_frequencies(matched_words)
fig, axes = plt.subplots(1, 2, figsize=(16, 8))
axes[0].imshow(cloud, interpolation='bilinear'); axes[0].axis('off')
axes[0].set_title('Negative tweets: same top 30 words, font size encodes frequency')
top_bar(Counter(matched_words), axes[1], 'Negative tweets: same top 30 words', n=30, color=COLORS['negative'])
plt.tight_layout(); plt.show()
''')

md('## Part C — Lexicon sentiment versus human labels\n### C1 — Every tweet, class metrics, baseline, and agreement')
code('''
def evaluation(frame):
    y, prediction = frame.airline_sentiment, frame.vader_label
    return {'tweets': len(frame), 'accuracy': accuracy_score(y, prediction),
            'balanced accuracy': balanced_accuracy_score(y, prediction),
            'macro F1': f1_score(y, prediction, labels=LABELS, average='macro', zero_division=0),
            'Cohen kappa': cohen_kappa_score(y, prediction, labels=LABELS),
            'always-negative baseline': y.eq('negative').mean()}
overall_metrics = pd.DataFrame({'All original rows': evaluation(raw),
                                'Unique tweets (main analysis)': evaluation(df)}).T
display(overall_metrics.round(4))
class_metrics = pd.DataFrame(classification_report(df.airline_sentiment, df.vader_label,
                            labels=LABELS, output_dict=True, zero_division=0)).T
display(class_metrics.round(4))
cm = confusion_matrix(df.airline_sentiment, df.vader_label, labels=LABELS)
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=LABELS, yticklabels=LABELS, ax=axes[0])
sns.heatmap(cm/cm.sum(axis=1, keepdims=True), annot=True, fmt='.1%', cmap='Blues',
            vmin=0, vmax=1, xticklabels=LABELS, yticklabels=LABELS, ax=axes[1])
for ax, title in zip(axes, ['Confusion matrix: unique tweet counts', 'Recall by human label: row percentages']):
    ax.set(xlabel='VADER prediction', ylabel='Human label', title=title)
plt.tight_layout(); plt.show()
display(raw[['tweet_id', 'text', 'airline_sentiment', 'vader_compound', 'vader_label']].head(10))
''')

md('### C2 — Strongest disagreements and a manually reviewed error sample')
code('''
disagreements = df[df.vader_label.ne(df.airline_sentiment)].copy()
human_target = disagreements.airline_sentiment.map({'negative': -1, 'neutral': 0, 'positive': 1})
disagreements['disagreement_distance'] = (disagreements.vader_compound - human_target).abs()
strongest_errors = disagreements.sort_values(['disagreement_distance', 'tweet_id'], ascending=[False, True]).head(40).copy()
display(strongest_errors[['tweet_id', 'text', 'airline_sentiment', 'vader_compound', 'vader_label',
                          'disagreement_distance']].head(12))
''')

# A manually reviewed annotation cell is inserted after inspecting the first execution.
annotation_path = ROOT / '.lab11_work' / 'annotations.py'
if annotation_path.exists():
    code(annotation_path.read_text(encoding='utf-8'))
else:
    code('''
strongest_errors[['tweet_id', 'text', 'airline_sentiment', 'vader_compound']].to_csv(
    '.lab11_work/errors_for_review.csv', index=False)
''')

md('### C3 — Three constructed failures and a word-count baseline')
code('''
constructed = pd.DataFrame([
    ('Sarcasm', 'Wonderful, another cancelled flight. Just what I wanted!', 'negative'),
    ('Domain meaning', 'My suitcase never arrived at the destination.', 'negative'),
    ('Mixed feelings / urgency', 'The crew was lovely and kind, but I am still stranded overnight.', 'negative')
], columns=['failure mechanism', 'text', 'intended sentiment'])
def lexicon_sum(text):
    return sum(sia.lexicon.get(w.lower(), 0) for w in tweet_tokenizer.tokenize(text))
constructed['uncontextualized lexicon sum'] = constructed.text.map(lexicon_sum)
constructed['VADER compound'] = constructed.text.map(compound)
constructed['VADER label'] = constructed['VADER compound'].map(sentiment_label)
constructed['VADER matches intended'] = constructed['VADER label'].eq(constructed['intended sentiment'])
display(constructed)
display(pd.Series({w: sia.lexicon.get(w, 0.0) for w in ['delayed','cancelled','canceled','stranded','lovely','kind']},
                  name='VADER lexicon valence (0 if absent)').to_frame())
''')

md('### C4 — Label confidence, sensitivity, and disputed duplicate labels')
code('''
HIGH_CONFIDENCE = 0.9
high_confidence = df[df.airline_sentiment_confidence.ge(HIGH_CONFIDENCE)]
low_confidence = df[df.airline_sentiment_confidence.lt(HIGH_CONFIDENCE)]
confidence_metrics = pd.DataFrame({'All unique tweets': evaluation(df),
                                  'Confidence >= 0.90': evaluation(high_confidence),
                                  'Confidence < 0.90': evaluation(low_confidence)}).T
display(confidence_metrics.round(4))
display(pd.crosstab(df.airline_sentiment, df.airline_sentiment_confidence.ge(HIGH_CONFIDENCE),
                   normalize='columns').rename(columns={False:'Below 0.90', True:'At least 0.90'}).round(3))
display(pd.DataFrame(classification_report(high_confidence.airline_sentiment, high_confidence.vader_label,
                    labels=LABELS, output_dict=True, zero_division=0)).T.round(4))
disputed_ids = duplicate_rows.groupby('tweet_id').airline_sentiment.nunique()
display(duplicate_rows.loc[duplicate_rows.tweet_id.isin(disputed_ids[disputed_ids.gt(1)].index),
                          ['tweet_id','text','airline_sentiment','airline_sentiment_confidence']].head(12))
''')

md('## Part D — Airline comparison, time patterns, and response priorities\n### D1 — Customer service versus operations and complaint mix')
code('''
negative = df[df.airline_sentiment.eq('negative')].copy()
negative['reason'] = negative.negativereason.fillna('Unspecified')
reason_counts = pd.crosstab(negative.airline, negative.reason)
reason_shares = reason_counts.div(reason_counts.sum(axis=1), axis=0)*100
display(reason_counts); display(reason_shares.round(1))
fig, ax = plt.subplots(figsize=(13, 5))
sns.heatmap(reason_shares, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax, cbar_kws={'label':'% of airline negative tweets'})
ax.set(title='Complaint mix within each airline (human reason labels)', xlabel='Complaint reason', ylabel='Airline')
plt.xticks(rotation=35, ha='right'); plt.tight_layout(); plt.show()
operations = {'Late Flight', 'Cancelled Flight', 'Lost Luggage', 'Damaged Luggage'}
negative['complaint family'] = np.select([
    negative.reason.eq('Customer Service Issue'), negative.reason.isin(operations)],
    ['Customer service', 'Operations'], default='Other / unclear')
family_counts = pd.crosstab(negative.airline, negative['complaint family'])
family_shares = family_counts.div(family_counts.sum(axis=1), axis=0)*100
display(family_shares.round(2))
family_shares.plot.barh(stacked=True, figsize=(10, 5), color=['#5B83B4','#D9934A','#B1B5BA'])
plt.title('Defined complaint families as shares of negative tweets')
plt.xlabel('Share of negative tweets (%)'); plt.legend(bbox_to_anchor=(1.02,1)); plt.tight_layout(); plt.show()
# Sensitivity to uncertain complaint and sentiment labels.
reliable_reasons = negative[negative.airline_sentiment_confidence.ge(0.9) &
                             negative.negativereason_confidence.ge(0.9)]
reliable_families = pd.crosstab(reliable_reasons.airline, reliable_reasons['complaint family'])
reliable_family_shares = reliable_families.div(reliable_families.sum(axis=1),axis=0)*100
display(reliable_family_shares.round(2))
''')

md('### D2 — Raw negative counts versus sentiment shares')
code('''
sentiment_counts = pd.crosstab(df.airline, df.airline_sentiment).reindex(columns=LABELS, fill_value=0)
sentiment_shares = sentiment_counts.div(sentiment_counts.sum(axis=1), axis=0)*100
airline_summary = pd.DataFrame({'total tweets': sentiment_counts.sum(axis=1),
                                'negative count': sentiment_counts.negative,
                                'negative share (%)': sentiment_shares.negative})
airline_summary['count rank'] = airline_summary['negative count'].rank(ascending=False,method='min').astype(int)
airline_summary['share rank'] = airline_summary['negative share (%)'].rank(ascending=False,method='min').astype(int)
display(airline_summary.sort_values('negative count',ascending=False).round(2))
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
sentiment_counts.plot.barh(stacked=True, color=[COLORS[s] for s in LABELS], ax=axes[0])
sentiment_shares.plot.barh(stacked=True, color=[COLORS[s] for s in LABELS], ax=axes[1])
axes[0].set(title='Sentiment counts: workload', xlabel='Unique tweets')
axes[1].set(title='Sentiment composition: sampled opinion', xlabel='Share of airline tweets (%)', xlim=(0,100))
for ax in axes: ax.legend(title='Human sentiment', loc='upper center', bbox_to_anchor=(0.5,-0.13), ncol=3)
plt.tight_layout(); plt.show()
''')

md('### D3 — Daily negative sentiment and observation-window limits')
code('''
df['day_utc'] = df.created_utc.dt.floor('D')
daily = df.groupby('day_utc').agg(total=('tweet_id','size'),
            negative=('airline_sentiment',lambda x: x.eq('negative').sum()))
daily['negative share (%)'] = daily.negative/daily.total*100
minimum_time, maximum_time = df.created_utc.min(), df.created_utc.max()
daily['boundary day (partial coverage)'] = daily.index.isin([minimum_time.floor('D'), maximum_time.floor('D')])
display(daily.round(2))
fig, axes = plt.subplots(2, 1, figsize=(12, 7), sharex=True)
axes[0].plot(daily.index,daily.total,marker='o',label='All tweets',color='#4179A3')
axes[0].plot(daily.index,daily.negative,marker='o',label='Negative tweets',color=COLORS['negative'])
axes[0].set(ylabel='Unique tweets',title='Daily tweet volume (UTC; boundary days are partial)'); axes[0].legend()
axes[1].plot(daily.index,daily['negative share (%)'],marker='o',color=COLORS['negative'])
axes[1].set(ylabel='Negative share (%)',xlabel='UTC date',ylim=(0,100))
for ax in axes:
    for date in daily.index[daily['boundary day (partial coverage)']]:
        ax.axvspan(date-pd.Timedelta(hours=8),date+pd.Timedelta(hours=8),color='grey',alpha=.15)
plt.tight_layout(); plt.show()
daily_airline = df.groupby(['day_utc','airline']).airline_sentiment.agg(
    lambda x: x.eq('negative').mean()*100).unstack()
fig, ax = plt.subplots(figsize=(11,5))
sns.heatmap(daily_airline.T,annot=True,fmt='.0f',cmap='Reds',vmin=0,vmax=100,ax=ax,
            xticklabels=[x.strftime('%b %d') for x in daily_airline.index],cbar_kws={'label':'Negative share (%)'})
ax.set(title='Negative share by airline and UTC date',xlabel='UTC date',ylabel='Airline')
plt.tight_layout(); plt.show()
complete_days = daily.loc[~daily['boundary day (partial coverage)']]
peak_day = complete_days.negative.idxmax()
peak_share_day = complete_days['negative share (%)'].idxmax()
display(pd.crosstab(df.loc[df.day_utc.eq(peak_day) & df.airline_sentiment.eq('negative'), 'airline'],
                    df.loc[df.day_utc.eq(peak_day) & df.airline_sentiment.eq('negative'), 'negativereason']))
''')

md('### D4 — Proposed response-priority rule and ranked queue')
code(r'''
queue = negative.copy()
queue['immediate need'] = queue.text.str.contains(
    r'\b(?:stranded|stuck|urgent|emergency|medical|overnight|insulin|wheelchair)\b|\bmiss(?:ed|ing)? (?:my |our )?connection\b',
    case=False,regex=True)
queue['disruption reason'] = queue.reason.isin(['Cancelled Flight','Lost Luggage','Damaged Luggage'])
queue['repeated contact'] = queue.text.str.contains(
    r'\b(?:on hold|hours?|days?|again|still waiting|no response)\b',case=False,regex=True)
queue['priority tier'] = np.select([queue['immediate need'],
    queue['disruption reason'] | queue['repeated contact']], [1,2],default=3)
# Urgency first, then repeated contact, then capped reach, then oldest timestamp.
queue['capped retweets'] = queue.retweet_count.clip(upper=10)
queue = queue.sort_values(['priority tier','repeated contact','capped retweets','created_utc'],
                          ascending=[True,False,False,True])
queue['label needs review'] = queue.airline_sentiment_confidence.lt(0.9)
display(queue[['tweet_id','airline','text','reason','priority tier','immediate need',
               'repeated contact','retweet_count','label needs review']].head(15))
display(queue.groupby('priority tier').agg(tweets=('tweet_id','size'),
           low_confidence=('label needs review','sum')))
''')

md('## Part E — Reliability and decisions\n### E1 — Sampling bias and least reliable finding')
code('''
metadata_missing = df[['tweet_coord','tweet_location','user_timezone']].isna().mean().mul(100)
user_counts = df.groupby('name', dropna=False).size()
bias_evidence = pd.Series({'Negative share of unique tweets (%)': df.airline_sentiment.eq('negative').mean()*100,
                           'Largest airline / smallest airline sample ratio': airline_summary['total tweets'].max()/airline_summary['total tweets'].min(),
                           'Tweets from handles posting more than once (%)': df['name'].isin(user_counts[user_counts.gt(1)].index).mean()*100,
                           **{f'Missing {k} (%)': v for k,v in metadata_missing.items()}}, name='Evidence')
display(bias_evidence.round(2).to_frame())
''')
md('### E2 — 2015 observation window and predictions for a new sample')
code('''
display(pd.Series({'First observed tweet (UTC)': str(minimum_time),
                   'Last observed tweet (UTC)': str(maximum_time),
                   'Observed span in days': (maximum_time-minimum_time).total_seconds()/86400,
                   'Distinct airlines': df.airline.nunique()},name='Historical coverage').to_frame())
''')
md('### E3 — Decision on replacing manual review')
code('''
human_negative = df.airline_sentiment.eq('negative')
missed_negative = human_negative & df.vader_label.ne('negative')
decision_evidence = pd.Series({'Unique tweets':len(df),
                              'VADER agrees with human':df.vader_label.eq(df.airline_sentiment).sum(),
                              'Human-negative tweets missed':missed_negative.sum(),
                              'Human-negative tweets missed (%)':100*missed_negative.sum()/human_negative.sum(),
                              'VADER macro F1':f1_score(df.airline_sentiment,df.vader_label,labels=LABELS,average='macro')})
display(decision_evidence.round(4).to_frame('value'))
''')

md('## Part F — Three additional insights\n### F1 — Concentration of complaints across distinct customer handles')
code('''
negative_by_user = negative.groupby('name', dropna=False).agg(
    tweets=('tweet_id','size'), airlines=('airline','nunique'))
repeat_handles = negative_by_user.index[negative_by_user.tweets.gt(1)]
repeat_negative_share = negative.name.isin(repeat_handles).mean()*100
one_per_user_airline = (df.sort_values('created_utc')
                       .drop_duplicates(['name','airline'],keep='first'))
user_weighted_share = (one_per_user_airline.groupby('airline').airline_sentiment
                       .apply(lambda s:s.eq('negative').mean()*100))
user_sensitivity = pd.DataFrame({'All unique tweets: negative %':sentiment_shares.negative,
                                 'First tweet per handle-airline: negative %':user_weighted_share})
user_sensitivity['change (percentage points)'] = user_sensitivity.iloc[:,1]-user_sensitivity.iloc[:,0]
display(pd.Series({'Negative tweets from repeat negative posters (%)':repeat_negative_share,
                   'Distinct negative-posting handles':len(negative_by_user),
                   'Negative-posting handles with multiple tweets':len(repeat_handles)}).to_frame('value'))
display(user_sensitivity.round(2))
user_sensitivity.iloc[:,:2].plot.barh(figsize=(10,5),color=['#C44E52','#5B83B4'])
plt.xlabel('Negative share (%)'); plt.title('Customer concentration sensitivity (first observed tweet only)')
plt.legend(bbox_to_anchor=(1.02,1)); plt.tight_layout(); plt.show()
''')

md('### F2 — Nonstandard text artifacts and sensitivity of word counts')
code(r'''
artifact_flags = pd.DataFrame({pattern: df.text.str.contains(pattern, case=False, regex=False)
                               for pattern in ['Flightled', 'Cancelled Flight', 'Late Flight']})
artifact_summary = pd.DataFrame({'matching tweets': artifact_flags.sum(),
                                 'share of unique tweets (%)': artifact_flags.mean()*100})
display(artifact_summary.round(3))
display(df.loc[artifact_flags.Flightled, ['text', 'airline_sentiment', 'negativereason']].head(8))
before_artifact_exclusion = word_counts(stage_tokens['8 Remove airline names and generic filler'])
artifact_sensitivity = pd.DataFrame({'before exclusion':pd.Series(dict(before_artifact_exclusion.most_common(20))),
                                    'after exclusion':pd.Series(dict(clean_counts.most_common(20)))}).fillna(0)
display(artifact_sensitivity.sort_values('before exclusion',ascending=False).astype(int))
artifact_summary['matching tweets'].plot.barh(figsize=(9,4),color='#9A6FB0')
plt.xlabel('Unique tweets containing the literal string')
plt.title('Source-text anomalies: provenance needs verification')
plt.tight_layout(); plt.show()
''')

md('### F3 — Retweets measure limited public amplification')
code('''
amplification = df.groupby('airline_sentiment').agg(tweets=('tweet_id','size'),
    retweeted_tweets=('retweet_count',lambda s:s.gt(0).sum()),
    total_recorded_retweets=('retweet_count','sum'), median_retweets=('retweet_count','median'))
amplification['retweeted share (%)'] = amplification.retweeted_tweets/amplification.tweets*100
display(amplification.reindex(LABELS).round(3))
display(df.nlargest(5,'retweet_count')[['airline','text','airline_sentiment','retweet_count']])
fig, axes = plt.subplots(1,2,figsize=(12,4))
amplification.reindex(LABELS)['retweeted share (%)'].plot.bar(ax=axes[0],color=[COLORS[s] for s in LABELS],rot=0)
axes[0].set(title='How many tweets received a recorded retweet?',ylabel='Share of tweets (%)',xlabel='Human sentiment')
axes[1].hist(df.retweet_count,bins=[-.5,.5,1.5,2.5,5.5,10.5,50.5],color='#4179A3',edgecolor='white')
axes[1].set(title='Recorded retweet distribution',xlabel='Retweet count',ylabel='Tweets (log scale)',yscale='log')
plt.tight_layout(); plt.show()
''')

md('## Validation — Dataset and analysis consistency')
code('''
assert len(raw) == raw.vader_compound.notna().sum()
assert df.tweet_id.is_unique
assert df.vader_label.isin(LABELS).all()
assert df.tokens.map(lambda ts: isinstance(ts,list)).all()
assert all(word not in final_stop for word in ['not','no','nor'])
assert np.allclose(sentiment_shares.sum(axis=1),100)
assert np.allclose(reason_shares.sum(axis=1),100)
assert cm.sum() == len(df)
assert len(constructed) == 3
assert not constructed['VADER matches intended'].any()
assert len(strongest_errors) == len(reviewed_causes) == 40
assert len(user_sensitivity) == df.airline.nunique()
print('All consistency checks passed.')
''')

nb = nbf.v4.new_notebook(cells=cells)
nb.metadata = {'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},
               'language_info':{'name':'python','version':'3.14.0'}}
nbf.write(nb, ROOT/'Lab11_Solution.ipynb')
print(f'Created {len(cells)} cells')
