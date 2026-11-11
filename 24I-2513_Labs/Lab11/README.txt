LAB 11 - Airline tweets

Open 24I-2513_BDS-5B_Lab11.html for the complete executed report, or 24I-2513_BDS-5B_Lab11.ipynb for editable code and outputs.
The one-page director brief is output/pdf/Director_Brief.pdf.

Reproduce:
1. Install Python 3.11 or later.
2. pip install -r requirements.txt
3. Open 24I-2513_BDS-5B_Lab11.ipynb in Jupyter or VS Code and Run All from this folder.
   NLTK resources download on first execution (internet required).
4. Optional HTML export: jupyter nbconvert --to html 24I-2513_BDS-5B_Lab11.ipynb

View through a local server:
python3 -m http.server 8000
Open http://localhost:8000/24I-2513_BDS-5B_Lab11.html
The delivered HTML embeds chart images and has no remote runtime dependency.

Files:
dataset/Tweets.csv - unmodified original supplied dataset
dataset/tweets_cleaned.csv - deduplicated by ID, cleaned topic text and VADER predictions
dataset/sentiment_disagreements.csv - model/annotation errors with heuristic cause cues
dataset/priority_queue.csv - proposed human-negative response queue
findings.json - calculated headline findings
Lab Manual 11.docx - original instructions

Repository location: 24I-2513_Labs/Lab11. GCR submission is separate.
