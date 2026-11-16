from pathlib import Path
import nbformat as nb
n=nb.v4.new_notebook(); cells=[]
def part(title,code):
 cells.append(nb.v4.new_markdown_cell(title));cells.append(nb.v4.new_code_cell(code.strip()))
cells.append(nb.v4.new_markdown_cell('# Lab 11 — Simple Complete Solution\nKeep `Tweets.csv` beside this notebook. Brief explanations are in `Lab11_Explanations.txt`.'))
part('## Setup', '''import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import re, nltk
from collections import Counter
from nltk.tokenize import TweetTokenizer
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.sentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics import classification_report, confusion_matrix
from wordcloud import WordCloud

for item in ['stopwords', 'wordnet', 'vader_lexicon']:
    nltk.download(item, quiet=True)
plt.rcParams['figure.figsize'] = (7, 3)
pd.set_option('display.max_colwidth', 70)
df = pd.read_csv('Tweets.csv', dtype={'tweet_id': str})
df['date'] = pd.to_datetime(df['tweet_created'], utc=True)
tk = TweetTokenizer(preserve_case=False, reduce_len=True)
sia = SentimentIntensityAnalyzer()
def score(text):
    return sia.polarity_scores(text)['compound']
def label(value):
    return 'positive' if value >= .05 else 'negative' if value <= -.05 else 'neutral'
''')
part('## Part A — Preparing Text\n### A1 — Tokenizers and tweet features',r'''
examples = ['@Airline soooo happy :) #NotHappy https://example.com 😡']
for text in examples:
    print('Naive:', re.findall(r'\w+', text))
    print('Tweet-aware:', tk.tokenize(text))
features = {'handles': r'@\w+', 'hashtags': r'#\w+', 'links': r'https?://\S+',
            'emoji': r'[\U0001F300-\U0001FAFF]', 'stretched words': r'([a-z])\1{2,}'}
for feature, pattern in features.items():
    found = df['text'].apply(lambda t: bool(re.search(pattern, t, re.I)))
    print(feature, ':', found.sum(), '|', df.loc[found, 'text'].iloc[0][:75])
def clean(text):
    text = re.sub(r'https?://\S+|www\.\S+|@\w+', '', text)
    text = re.sub(r'#(\w+)', r'\1', text)
    return [w for w in tk.tokenize(text) if re.fullmatch(r"[a-z]+(?:'[a-z]+)?", w)]
df['tokens'] = df['text'].apply(clean)
display(df[['text', 'tokens']].head(2))
''')
part('### A2 — Keep negation; test stop-word removal', '''standard = set(stopwords.words('english'))
negations = {'not', 'no', 'nor', 'never', 'neither', 'cannot'}
stops = {w for w in standard if w not in negations and not w.endswith("n't")}
def remove_stops(text, stop_list):
    return ' '.join(w for w in tk.tokenize(text) if w not in stop_list)
demo = pd.DataFrame({'text': ['The service is not good', 'The flight was not bad']})
demo['standard removal'] = demo.text.apply(lambda t: remove_stops(t, standard))
demo['score before'] = demo.text.apply(score)
demo['score after'] = demo['standard removal'].apply(score)
display(demo)
df['vader_score'] = df.text.apply(score)  # Always score the original tweet.
df['vader_label'] = df.vader_score.apply(label)
for name, stop_list in [('Standard', standard), ('Keep negation', stops)]:
    predictions = df.text.apply(lambda t: label(score(remove_stops(t, stop_list))))
    print(name, 'accuracy:', round((predictions == df.airline_sentiment).mean(), 3))
df['no_stop'] = df.tokens.apply(lambda words: [w for w in words if w not in stops])
''')
part('### A3 — Stemming and lemmatization', '''stemmer = PorterStemmer()
lemma = WordNetLemmatizer()
def base(word):
    return lemma.lemmatize(lemma.lemmatize(word, 'v'), 'n')
words = ['flying', 'service', 'customers', 'delayed', 'caring']
display(pd.DataFrame({'word': words, 'stem': [stemmer.stem(w) for w in words],
                      'lemma': [base(w) for w in words]}))
df['stems'] = df.no_stop.apply(lambda ws: [stemmer.stem(w) for w in ws])
df['lemmas'] = df.no_stop.apply(lambda ws: [base(w) for w in ws])
for column in ['no_stop', 'stems', 'lemmas']:
    print(column, 'vocabulary:', len(set(w for ws in df[column] for w in ws)))
''')
part('### A4 — Measure losses at each step', '''df['raw_tokens'] = df.text.apply(tk.tokenize)
audit = []
for column in ['raw_tokens', 'tokens', 'no_stop', 'lemmas']:
    lengths = df[column].apply(len)
    audit.append([column, len(set(w for ws in df[column] for w in ws)),
                  lengths.sum(), round(lengths.mean(), 1), (lengths == 0).sum()])
display(pd.DataFrame(audit, columns=['Step', 'Vocabulary', 'Tokens', 'Mean length', 'Empty']))
''')
part('## Part B — Words and Phrases\n### B1 — Raw versus cleaned words', '''airlines = {'united', 'usairways', 'americanair', 'southwestair', 'jetblue',
            'virginamerica', 'american', 'southwest', 'delta', 'airline', 'airlines',
            'virgin', 'america', 'airways', 'flightled', 'u', 'us', 'please'}
df['final_tokens'] = df.lemmas.apply(lambda ws: [w for w in ws if w not in airlines])
df['joined_text'] = df.final_tokens.apply(' '.join)
raw_counts = Counter(w for ws in df.raw_tokens for w in ws)
counts = Counter(w for ws in df.final_tokens for w in ws)
print('Raw top tokens:', raw_counts.most_common(8))
pd.Series(dict(counts.most_common(10))).sort_values().plot.barh(title='Top cleaned words')
plt.show()
''')
part('### B2 — Distinctive TF-IDF words and normalized comparison', '''polar = df[df.airline_sentiment.isin(['positive', 'negative'])]
tfidf = TfidfVectorizer(min_df=10)
X = tfidf.fit_transform(polar.joined_text)
means = pd.DataFrame(index=tfidf.get_feature_names_out())
for group in ['positive', 'negative']:
    means[group] = np.asarray(X[(polar.airline_sentiment == group).values].mean(axis=0)).ravel()
means['difference'] = means.positive - means.negative
print('Positive:', ', '.join(means.nlargest(5, 'difference').index))
print('Negative:', ', '.join(means.nsmallest(5, 'difference').index))
means['difference'].sort_values().iloc[np.r_[0:5, -5:0]].plot.barh(title='Mean TF-IDF: positive minus negative')
plt.show()
comparison = pd.DataFrame(index=[w for w, count in counts.most_common(8)])
for group in ['positive', 'negative']:
    c = Counter(w for ws in df.loc[df.airline_sentiment == group, 'final_tokens'] for w in ws)
    comparison[group] = [1000*c[w]/sum(c.values()) for w in comparison.index]
comparison['negative'] *= -1
comparison.plot.barh(title='Butterfly: occurrences per 1,000 tokens'); plt.show()
''')
part('### B3 — Bigrams, trigrams, and negation',r'''
negative = df[df.airline_sentiment == 'negative']
# Keep stop words: phrases must contain genuinely adjacent words.
phrases = negative.tokens.apply(' '.join)
for size in [2, 3]:
    cv = CountVectorizer(ngram_range=(size, size), min_df=3)
    Xn = cv.fit_transform(phrases)
    freq = pd.Series(np.asarray(Xn.sum(axis=0)).ravel(), index=cv.get_feature_names_out())
    print(f'Top {size}-grams:', freq.nlargest(5).to_dict())
for phrase in ['on hold', 'lost my bag', 'not good', 'not happy']:
    matches = negative.text.str.contains(phrase, case=False, regex=False)
    print(phrase, ':', matches.sum(), 'tweets')
display(pd.DataFrame({'phrase': ['good', 'not good', 'happy', 'not happy'],
                      'score': [score(t) for t in ['good', 'not good', 'happy', 'not happy']]}))
''')
part('### B4 — Same words: cloud versus bars', '''neg_counts = Counter(w for ws in negative.final_tokens for w in ws)
top = dict(neg_counts.most_common(10))
cloud = WordCloud(background_color='white', random_state=11).generate_from_frequencies(top)
fig, axes = plt.subplots(1, 2, figsize=(8, 3))
axes[0].imshow(cloud); axes[0].axis('off')
pd.Series(top).sort_values().plot.barh(ax=axes[1])
plt.tight_layout(); plt.show()
''')
part('## Part C — Sentiment Analysis\n### C1 — Agreement, class metrics, and confusion matrix', '''print('Agreement:', round((df.vader_label == df.airline_sentiment).mean(), 3))
print('Always-negative baseline:', round((df.airline_sentiment == 'negative').mean(), 3))
print(classification_report(df.airline_sentiment, df.vader_label, digits=2))
labels = ['negative', 'neutral', 'positive']
sns.heatmap(confusion_matrix(df.airline_sentiment, df.vader_label, labels=labels),
            annot=True, fmt='d', xticklabels=labels, yticklabels=labels, cmap='Blues')
plt.xlabel('VADER'); plt.ylabel('Human'); plt.show()
''')
part('### C2 — Strong disagreements and reviewed causes', '''errors = df[df.vader_label != df.airline_sentiment].copy()
target = errors.airline_sentiment.map({'negative': -1, 'neutral': 0, 'positive': 1})
errors['distance'] = (errors.vader_score - target).abs()
display(errors.nlargest(4, 'distance')[['text', 'airline_sentiment', 'vader_score']])
# Manual review of 40 strongest unique-tweet disagreements from the original analysis.
review = pd.Series({'Sarcasm': 13, 'Mixed / polite wording': 11, 'Implicit disruption': 6,
                    'Uncertain context / label': 4, 'Negation': 3, 'Wrong airline target': 3})
display(review.to_frame('Reviewed tweets (selected sample, not all errors)'))
''')
part('### C3 — Run three constructed failures', '''examples = pd.DataFrame({'text': [
    'Wonderful, another cancelled flight. Just what I wanted!',
    'My suitcase never arrived at the destination.',
    'The crew was lovely and kind, but I am still stranded overnight.'],
    'intended': ['negative'] * 3})
examples['VADER score'] = examples.text.apply(score)
examples['prediction'] = examples['VADER score'].apply(label)
display(examples)
''')
part('### C4 — High-confidence human labels', '''for name, sample in [('All', df), ('Confidence >= 0.9', df[df.airline_sentiment_confidence >= .9])]:
    print(name, '| tweets:', len(sample), '| accuracy:',
          round((sample.vader_label == sample.airline_sentiment).mean(), 3),
          '| negative share:', round((sample.airline_sentiment == 'negative').mean(), 3))
''')
part('## Part D — Business Comparisons\n### D1 — Complaint mix: service versus operations', '''mix = pd.crosstab(negative.airline, negative.negativereason)
mix_pct = mix.div(mix.sum(axis=1), axis=0) * 100
operations = ['Late Flight', 'Cancelled Flight', 'Lost Luggage', 'Damaged Luggage']
families = pd.DataFrame({'Service %': mix_pct['Customer Service Issue'],
                         'Operations %': mix_pct[operations].sum(axis=1)})
display(families.round(1))
sns.heatmap(mix_pct, cmap='YlOrRd'); plt.title('Complaint mix (%)')
plt.xticks(rotation=45, ha='right'); plt.tight_layout(); plt.show()
''')
part('### D2 — Counts versus percentages', '''totals = pd.crosstab(df.airline, df.airline_sentiment)
percent = totals.div(totals.sum(axis=1), axis=0) * 100
display(pd.DataFrame({'Negative count': totals.negative, 'Negative %': percent.negative.round(1)}))
percent[['negative', 'neutral', 'positive']].plot.barh(stacked=True, color=['#c44e52', 'gray', '#319270'])
plt.xlabel('Share (%)'); plt.legend(loc='upper center', bbox_to_anchor=(.5, -.2), ncol=3); plt.show()
''')
part('### D3 — Daily sentiment spikes', '''daily = df.groupby(df.date.dt.date).airline_sentiment.agg(
    total='size', negative=lambda s: (s == 'negative').sum())
daily['negative %'] = daily.negative / daily.total * 100
display(daily.round(1))
daily['negative %'].plot(marker='o', title='Daily negative share (UTC; boundary days partial)')
plt.ylabel('Negative %'); plt.tight_layout(); plt.show()
''')
part('### D4 — Implement a response queue',r'''
queue = negative.copy()
urgent = queue.text.str.contains(r'\b(?:stranded|stuck|urgent|medical|overnight|wheelchair)\b', case=False)
unresolved = queue.text.str.contains(r'on hold|still waiting|no response|hours?', case=False)
disruption = queue.negativereason.isin(['Lost Luggage', 'Cancelled Flight'])
queue['priority'] = np.select([urgent, unresolved | disruption], [1, 2], default=3)
queue = queue.sort_values(['priority', 'date'])
display(queue[['priority', 'airline', 'text']].head(4))
print(queue.priority.value_counts().sort_index())
''')
part('## Part E — Limits and Decisions\n### E1 — Sampling bias', '''print('Tweets by airline:', df.airline.value_counts().to_dict())
print('Repeated tweet IDs:', df.tweet_id.duplicated().sum())
print('Tweets from repeated handles:', round(df.name.duplicated(keep=False).mean(), 3))
''')
part('### E2 — Historical coverage', '''print('First:', df.date.min(), '| Last:', df.date.max())
''')
part('### E3 — Should automation replace manual review?', '''human_negative = df.airline_sentiment == 'negative'
missed = human_negative & (df.vader_label != 'negative')
print('Human-negative tweets missed:', missed.sum())
print('Miss rate:', round(missed.sum() / human_negative.sum(), 3))
''')
part('## Part F — Three Additional Insights\n### F1 — Repeated customer contact', '''posts = negative.groupby('name').size()
repeat = negative.name.isin(posts[posts > 1].index)
print('Negative tweets from repeat negative posters:', round(repeat.mean(), 3))
''')
part('### F2 — Source-text anomalies', '''for phrase in ['Flightled', 'Cancelled Flight', 'Late Flight']:
    print(phrase, ':', df.text.str.contains(phrase, case=False, regex=False).sum())
''')
part('### F3 — Public amplification', '''reach = df.groupby('airline_sentiment').retweet_count.agg(
    median='median', retweeted_share=lambda s: (s > 0).mean() * 100)
display(reach.round(2))
''')
n.cells=cells;n.metadata={'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'}}
nb.write(n,'Lab11_Solution_Simplified.ipynb')
print('Created',len(cells),'cells;',sum(len(c.source.splitlines()) for c in cells if c.cell_type=='code'),'code lines')
