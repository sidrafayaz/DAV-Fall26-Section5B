from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
r = json.loads((root/'.lab11_work/results.json').read_text(encoding='utf-8'))
def indexed(name, field='index'):
    return {row[field]:row for row in r[name]}
audit = r['cleaning_audit'][-1]
artifacts = indexed('artifact_summary')
causes = indexed('cause_counts', 'reviewed primary cause') if 'reviewed primary cause' in r['cause_counts'][0] else indexed('cause_counts')
largest = r['cause_counts'][0]
largest_cause = next(value for key,value in largest.items() if key != 'count')
largest_count = largest['count']

text = f'''# Lab 11 — Brief Explanations and Director's Brief

Companion notebook: Lab11_Solution.ipynb
Source: supplied Lab Manual 11.docx and Tweets.csv

## Director's one-page brief

Recommendation: keep analysts and use automation to support triage and topic monitoring. On 14,485 unique tweets from February 17–24, 2015 (UTC), VADER agrees with human sentiment labels on 54.3%, below the 62.7% always-negative accuracy baseline; it misses 4,568 of 9,083 human-negative tweets (50.3%). Its 89.8% negative precision can support identifying a subset of likely complaints, but it cannot safely clear other tweets from review.

Priorities: American has the largest customer-service share of complaints (39.6%), while Delta has the largest defined operations share (40.6%); these contrasts persist with high-confidence labels. Improve callback and case-ownership processes for service failures, and investigate delay, cancellation, and baggage workflows for operational failures. Negative tweets include 484 mentions of “on hold” and 69 matches for lost luggage or bags; these are keyword matches, not independently verified incidents.

Comparison: United has the most negative tweets (2,633), but US Airways has the highest negative share (77.7%, versus United's 68.9%). Use shares to compare sampled sentiment and counts to size response capacity. Negative volume peaks on February 23, while the highest negative share occurs on February 22; the file cannot establish causes or recurring seasonality.

Action: answer immediate disruption and vulnerability signals first, then unresolved or repeated-contact cases, using capped retweets only as a later sorting factor. Review sarcastic, mixed, ambiguous, and multi-airline tweets manually. The sample is old, self-selected, concentrated among repeat posters, and contains text anomalies; validate new decisions on a fresh representative sample and verified operational records.

## Reading the solution

Each heading below matches a notebook task/subpart; each explanation uses at most two sentences. The notebook contains task headings, code, and computed tables/charts; these interpretations and the brief remain in this file.

## Part A — Preparing tweet text

### A1 — Tweet features and tokenization
Following the manual's preprocessing guidance, we compare naive whitespace/word tokenization with TweetTokenizer on real handles, hashtags, URLs, emoticons/emojis, and stretched words, then remove handles/URLs, retain hashtag words, and reduce repeated letters for topic counts. Compound hashtags remain unsplit and alphabetic topic filtering loses emoji meaning, so VADER always receives original text with punctuation, case, and emoticons intact.

### A2 — Negation and stop words
Using the manual's warning that preprocessing changes meaning, we show that “not good” can become “good” and compare raw-text VADER accuracy (54.30%), standard stop-word removal (49.94%), and negation-preserving removal (53.76%). We retain “not”, “no”, “nor”, other negators, and negative contractions in the topic stop-word policy, while using raw tweets for final sentiment because even negation-preserving removal changes context.

### A3 — Stemming versus lemmatization
Applying the manual's base-form reduction methods to the same tokens reduces vocabulary from 10,956 words to 8,327 with Porter stemming and 9,329 with POS-aware lemmatization. We choose lemmatization for readable charts because stemming creates forms such as “servic” from “service”, while noting that automatic POS tags can still misread informal tweets.

### A4 — Cleaning losses
Following the manual's analysis-before-visualization approach, the stepwise audit measures vocabulary, total/mean/median token length, empty tweets, and each step's changes: raw vocabulary is 19,853 and final topic vocabulary is {audit['vocabulary']:,}, with {audit['empty tweets']} empty topic representations. Stop-word removal discards 101,632 token occurrences and alphabetic filtering loses numbers and emoji signals, so these transformations are too aggressive for sentiment or urgency detection; the original tweets and all unique rows are retained for those uses.

## Part B — Words and phrases

### B1 — Airline-name dominance
Using the manual's Counter-to-bar-chart method, we first show raw handles, punctuation, airline names, and filler, then remove those distractions for topic charts while keeping airline metadata for comparisons. Airline-handle dominance is consistent with collection around airline-directed conversations and suggests a selected customer-contact corpus, although the CSV alone does not establish the exact collection query.

### B2 — Words that separate sentiments
Following the manual's TF-IDF and butterfly-chart guidance, we compare mean tweet TF-IDF differences and occurrences per 1,000 topic tokens: “hour”, “hold”, “cancel”, and “delay” favor negative tweets, while “thank”, “thanks”, “great”, and “love” favor positive tweets. Raw counts confound the much larger negative group with distinctiveness and overemphasize shared words such as “flight”, so differences and normalized rates provide the more useful comparison.

### B3 — Operational and sentiment-changing phrases
Using the manual's bigram/trigram guidance, we preserve stop words and within-tweet word order to find “on hold” (484 matching negative tweets) and lost-luggage/bag phrases (69), which identify telephone support queues and baggage problems more specifically than isolated words. “Not good” and “not happy” reverse the positive meaning of “good” and “happy”, illustrating why removing negation or building n-grams after stop-word deletion would be misleading.

### B4 — Cloud versus bar chart
Following the manual's visual-encoding guidance, the cloud uses font size and the bar chart uses bar length for exactly the same top 30 negative words. We would show the Director the sorted bar chart because its common baseline and numeric axis support accurate comparisons, while cloud layout, word length, and font prominence can exaggerate perceived importance.

## Part C — Sentiment evaluation

### C1 — Agreement and hardest class
Using the manual's comparison with human labels, VADER scores all 14,640 original rows and obtains 54.29% accuracy, while the 14,485-unique-tweet analysis yields 54.30% accuracy, macro F1 0.511, and Cohen's kappa 0.313, below the 62.71% always-negative accuracy baseline. Neutral is hardest by class F1 (0.406) and recall (42.89%); overall accuracy hides negative recall of only 49.71% and positive precision of only 33.66%, despite positive recall of 87.19%.

### C2 — Strongest disagreements and causes
Applying the manual's error-critique approach, we rank disagreements by distance from the human sentiment target and manually code the top 40 into sarcasm, mixed/polite wording, implicit airline disruption, negation/informal spelling, airline-target mismatch, and context/label uncertainty; the largest reviewed cause is {largest_cause.lower()} ({largest_count}/40). These tentative primary causes describe a deliberately severe sample rather than all errors, so the fix is human review plus an airline-aware contextual model evaluated on a separate, manually audited representative set, with negation handling and entity targeting explicitly checked.

### C3 — Three constructed failures
Following the manual's warning that word counts lose context, our sarcastic “Wonderful, another cancelled flight” example scores +0.4574, a missing-suitcase tweet scores 0.0000, and praise for kind crew despite being stranded scores +0.5574, although all three are intended as negative. The failures respectively reflect irony, a serious domain event without lexicon-negative vocabulary, and positive wording masking unresolved harm; the notebook also shows the uncontextualized lexicon sums and checks actual VADER entries rather than assuming every airline word is absent.

### C4 — Confidence of human labels
Using the manual's ground-truth critique, retaining confidence >= 0.90 leaves 10,374 tweets and raises VADER accuracy from 54.30% to 58.59% and macro F1 from 0.511 to 0.529, but the always-negative baseline also rises to 70.63% because the class mix changes. The 18 repeated IDs with conflicting sentiment labels and the changed class composition show why confidence is an annotation-agreement signal rather than proof of truth, so we report both full and filtered results.

## Part D — Airline comparisons and action

### D1 — Service versus operations
Following the manual's category-comparison and heatmap guidance, American has the highest customer-service share (39.62% of its negative tweets) and Delta the highest operations share (40.63%), where operations is explicitly defined as Late Flight, Cancelled Flight, Lost Luggage, and Damaged Luggage. With both sentiment and reason confidence >= 0.90, those shares are 51.47% and 56.83%, supporting different sampled complaint mixes but not proving differences in actual service quality or operational failure rates.

### D2 — Counts versus shares
Using the manual's stacked sentiment bars, United ranks first in negative count (2,633) but third in negative share (68.89%), while US Airways ranks second in count (2,263) and first in share (77.69%). We would report sentiment shares with sample sizes for cross-airline comparison and retain counts for staffing needs, because neither quantity is normalized by passenger volume or random sampling.

### D3 — Time pattern and causality
Following the manual's sentiment-over-time approach, we convert timestamps to UTC and show both daily counts and shares: among interior days, negative volume peaks on February 23 (2,342), while negative share peaks on February 22 (72.91%). Boundary days have partial observation windows and the short, uneven sample has no weather, flight-volume, or event controls, so the apparent spike cannot establish its cause or a recurring weekly pattern.

### D4 — Response priorities
Using the manual's analysis-to-decision approach, the proposed queue puts explicit stranded/stuck/medical/urgent signals in tier 1 (339 tweets), cancellation/baggage or prolonged/repeated contact in tier 2 (3,145), and other negatives in tier 3 (5,599), then sorts by repeated-contact signal, capped retweets, and oldest timestamp. This is a proposed workload rule rather than validated urgency: verify each case, preserve low-confidence cases for review, never treat missing a keyword as safety, and apply it to raw-text signals alongside human review because VADER misses many complaints.

## Part E — Reliability and decisions

### E1 — Bias and least trusted finding
Applying the manual's visualization critique, at least three biases are self-selected airline-contact tweets, unequal airline sample sizes without passenger denominators, and correlated repeat posters; additionally, 93.05% of coordinates are missing and the short collection window may overrepresent particular disruptions. I trust population-wide airline-quality rankings least, since these charts describe sampled tweets rather than representative passenger satisfaction or causal airline performance.

### E2 — What could change today
Following the manual's limitations approach, I predict that a newly collected sample would change airline rankings, topic/phrase frequencies, platform-specific writing conventions, and VADER agreement because customer expectations, operations, and online participation can change. These are hypotheses rather than claims about current conditions; we would collect fresh data, check the available airline groups, and repeat the same comparisons before using the 2015 results for present-day decisions.

### E3 — Replace manual reading or assist it
Using the manual's human-versus-tool evaluation, I oppose replacing the team: VADER misses 4,568 human-negative tweets (50.29%), and the severe errors include sarcasm, mixed messages, domain context, and airline-target confusion. Its 89.81% precision for negative predictions can help surface a subset of likely complaints, but analyst review, an independently validated contextual model, and continuing monitoring are needed for reliable routing.

## Part F — Three additional insights

### F1 — Repeated customer contact concentrates the apparent workload
Observation: Repeat negative-posting handles account for 65.48% of negative tweets.
Evidence: F1 concentration table; Delta's negative share changes from 42.98% to 39.44% when only the first observed tweet per handle-airline pair is used.
Why it matters: tweet volume mixes the number of customers with repeat contact from unresolved cases
Recommended action: group conversations into cases, assign one owner, and track unique-customer and tweet-based metrics together
Confidence and limits: descriptive confidence high; handles are imperfect customer identifiers and a first tweet is not a complete case history
Manual link: This extends the manual's aggregation and comparison methods by changing the unit of analysis from tweets to customer-handle/airline pairs.

### F2 — Nonstandard source strings can distort apparent customer vocabulary
Observation: “Flightled” appears in {artifacts['Flightled']['matching tweets']} unique tweets and is excluded as a nonword from final topic charts.
Evidence: F2 source-string audit and before/after word-frequency table; the larger phrases “Cancelled Flight” and “Late Flight” also occur unusually in the supplied text.
Why it matters: prominent phrases may partly reflect source-text alterations or anomalies rather than natural customer wording
Recommended action: verify provenance against original records before quoting customers or interpreting cancellation-phrase counts, and keep an explicit artifact audit
Confidence and limits: literal string counts are reproducible; this file cannot establish who introduced the strings or reconstruct original wording
Manual link: This extends the manual's text-quality critique with a source-provenance check and a measurable sensitivity comparison.

### F3 — Public amplification is sparse and should not dominate response order
Observation: Only 6.55% of negative tweets have a recorded retweet, versus 3.26% of positive tweets, and every sentiment class has median retweets of zero.
Evidence: F3 amplification table and retweet histogram; 595 of 9,083 negative tweets have nonzero retweets.
Why it matters: a reach-only queue would overlook most sampled complaints even though negatives are more often amplified than positives
Recommended action: prioritize passenger need and unresolved disruption, using capped retweet counts only as a later sorting factor
Confidence and limits: counts describe this snapshot; retweets are not impressions, follower reach, or subsequent virality
Manual link: This extends the manual's numerical aggregation and charting principles to the difference between complaint frequency and recorded amplification.

## Scope note

The manual's generic submission section requests HTML/JavaScript, GitHub, and GCR uploads; your request specifically asks for an IPYNB and a separate explanation file, which are the two deliverables provided here. No account uploads or publishing were performed.
'''
(root/'Lab11_Explanations.txt').write_text(text, encoding='utf-8')
print('Created Lab11_Explanations.txt')
