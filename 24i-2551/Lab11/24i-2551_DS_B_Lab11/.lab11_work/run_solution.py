from pathlib import Path
import nbformat
from nbclient import NotebookClient

root = Path(__file__).resolve().parents[1]
path = root / 'Lab11_Solution.ipynb'
nb = nbformat.read(path, as_version=4)
nb.cells.append(nbformat.v4.new_code_cell('''
import json
tables = {name: globals()[name].reset_index().to_dict(orient='records') for name in [
    'vocabulary_sizes', 'cleaning_audit', 'ablation_metrics', 'overall_metrics', 'class_metrics',
    'constructed', 'confidence_metrics', 'reason_shares', 'family_shares',
    'reliable_family_shares', 'airline_summary', 'daily', 'user_sensitivity',
    'artifact_summary', 'amplification', 'operational_evidence', 'decision_evidence',
    'bias_evidence', 'negative_distinctive', 'positive_distinctive', 'feature_table', 'cause_counts']}
tables['scalars'] = {'unique_tweets': len(df), 'positive_tweets': df.airline_sentiment.eq('positive').sum(),
    'negative_tweets': len(negative), 'repeat_negative_share':repeat_negative_share,
    'peak_day':str(peak_day), 'peak_share_day':str(peak_share_day),
    'priority_tiers':queue['priority tier'].value_counts().to_dict(),
    'first':str(minimum_time),'last':str(maximum_time)}
Path('.lab11_work/results.json').write_text(json.dumps(tables,default=str,indent=2),encoding='utf-8')
'''))
client = NotebookClient(nb, timeout=900, kernel_name='python3', resources={'metadata':{'path':str(root)}})
try:
    client.execute()
finally:
    nb.cells = nb.cells[:-1]
    nbformat.write(nb, path)
print('Notebook executed and saved:', path)
print('Errors:', sum(o.output_type=='error' for c in nb.cells if c.cell_type=='code' for o in c.outputs))
print('Chart images:', sum('image/png' in o.get('data',{}) for c in nb.cells if c.cell_type=='code' for o in c.outputs))
