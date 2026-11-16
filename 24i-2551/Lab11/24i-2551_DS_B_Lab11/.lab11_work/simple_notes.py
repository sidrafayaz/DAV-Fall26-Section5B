from pathlib import Path
text = '''# Lab 11 — Short Notes

The notebook uses all original CSV rows; repeated IDs are reported in E1, so counts describe records rather than independent passengers. The small manual error review in C2 uses 40 unique tweets reviewed in the earlier analysis; its cause counts are annotations, not an automatically inferred explanation of every error.

## Director's brief
Use automation to assist analysts rather than replace them: VADER agreement is about 54%, and it misses roughly half of human-labeled complaints. Prioritize immediate disruption and unresolved contact, then investigate service and operational complaint mixes separately; compare airline sentiment percentages alongside counts, since the number of tweets differs substantially across airlines.
The daily plots describe this short 2015 sample and cannot explain causes or predict current service quality. Track repeat customer contact, check unusual source strings before quoting customers, and use recorded retweets as a secondary signal rather than urgency.

## Part A
### A1 — Tokenization
Using the manual's preprocessing approach, we compare naive and tweet-aware tokens, count real tweet features, remove handles/links for topics, retain hashtag words, and reduce stretched letters; original text preserves emoji and punctuation for sentiment, while compound hashtags remain unsplit.
### A2 — Negation
Following the manual's context warning, the examples and accuracy comparison show the effect of deleting negation; the final stop list keeps negators and negative contractions, and VADER scores original text.
### A3 — Base forms
Using the manual's stemming/lemmatization comparison, the word table and vocabulary counts support readable lemma-based topic labels; simple verb-then-noun lemmatization is imperfect and is deliberately excluded from sentiment input.
### A4 — Cleaning losses
Following the manual's quality checks, the audit reports vocabulary, total tokens, average length, and empty rows after each grouped cleaning stage; alphabetic filtering and stop-word removal lose context, so their output is used only for topics.

## Part B
### B1 — Frequent words
Using the manual's frequency method, raw counts expose filler and airline handles, then names are removed for topic bars; handle dominance suggests airline-directed collection but does not prove a particular scraping query.
### B2 — Distinctive words
Following the manual's TF-IDF and butterfly methods, mean score differences highlight positive/negative distinctions and normalized counts adjust for unequal class sizes; shared vocabulary and sample imbalance make raw counts insufficient.
### B3 — Phrases
Using the manual's n-gram approach, stop words remain inside bigrams/trigrams so “on hold” and “lost my bag” identify specific problems, while “not good” and “not happy” demonstrate sentiment reversal.
### B4 — Cloud or bars
Following the manual's encoding comparison, both charts use the same ten negative words; choose bars for the Director because a common baseline and numeric axis allow clearer magnitude comparisons than font sizes.

## Part C
### C1 — Agreement
Using the manual's human-label evaluation, compare accuracy with the always-negative baseline and inspect class precision/recall/F1; neutral is weakest by F1, while low negative recall and positive precision are hidden by a single agreement percentage.
### C2 — Causes of disagreement
Following the manual's error critique, the strongest examples and 40-tweet manual review identify sarcasm as the largest reviewed cause (13/40); preserve human review and validate an airline-aware contextual model on a separate representative sample, since this selected review cannot establish the largest cause across all errors.
### C3 — Constructed failures
Using the manual's context limitations, sarcastic praise is predicted positive, the missing-suitcase example neutral, and praise for crew despite being stranded positive; these illustrate irony, domain meaning, and mixed feelings respectively.
### C4 — Human confidence
Following the manual's ground-truth critique, compare measured accuracy and class mix above confidence 0.9; improved agreement does not prove correctness because filtering changes which tweets and sentiment classes remain.

## Part D
### D1 — Complaint mix
Using the manual's heatmap comparison, American shows the largest service-complaint share and Delta the largest defined operations share, combining delays, cancellations, and baggage issues; these sampled complaint proportions do not establish actual passenger-level failure rates.
### D2 — Counts versus shares
Following the manual's stacked-bar guidance, United has the largest negative count but US Airways the largest negative share; report shares with sample sizes for comparison and counts for response workload.
### D3 — Time pattern
Using the manual's time aggregation, compare daily counts and percentages: negative volume peaks on February 23, while negative share peaks on February 22 (UTC); partial boundary days and missing operational/weather evidence prevent a causal or recurring-pattern conclusion.
### D4 — Urgency
Applying the manual's decision focus, the implemented queue puts stranded/medical/urgent signals first, unresolved contact or cancellation/baggage cases second, then sorts oldest first; this transparent proposed rule needs case verification because keywords can miss urgent situations.

## Part E
### E1 — Bias
Following the manual's critique, self-selection into airline tweeting, unequal airline/passenger exposure, repeat posters, and the short collection window limit generalization; population-wide airline-quality rankings are the least trustworthy inference.
### E2 — A newer sample
Applying the manual's time-limit warning, airline rankings, topics, vocabulary, and model agreement could change with operations, customer expectations, and platform participation; these are predictions to test on fresh data rather than statements about current airlines.
### E3 — Manual team
Using the manual's evaluation principle, reject full replacement because agreement is below the majority baseline and many negative tweets are missed; use the tool for assisted monitoring with human review and ongoing validation.

## Part F — Additional insights
### F1 — Repeat contact
Observation: Repeat negative posters contribute about 65% of negative records.
Evidence: F1 computed repeat-poster proportion.
Why it matters: Tweet workload can reflect repeated unresolved contact.
Recommended action: Assign one case owner and report unique-customer counts too.
Confidence and limits: Direct sample counts; handles are imperfect customer identities.
Manual connection: Extends aggregation by distinguishing tweets from customers.

### F2 — Source artifacts
Observation: The nonword “Flightled” occurs in 501 source records.
Evidence: F2 literal-string counts, including other unusual repeated phrases.
Why it matters: Source anomalies can distort apparent customer vocabulary.
Recommended action: Verify original wording and exclude the nonword from topic charts.
Confidence and limits: Literal counts are reproducible; provenance is unknown.
Manual connection: Extends the preprocessing audit to source-text integrity.

### F3 — Amplification
Observation: Only about 6.6% of negative records have a recorded retweet; the median is zero.
Evidence: F3 retweeted-share and median table.
Why it matters: Most complaints would be overlooked by a popularity-only queue.
Recommended action: Put passenger need before amplification.
Confidence and limits: Snapshot retweets do not measure impressions or later virality.
Manual connection: Uses aggregation to distinguish frequency from public amplification.
'''
Path('Lab11_Simplified_Notes.txt').write_text(text,encoding='utf-8')
