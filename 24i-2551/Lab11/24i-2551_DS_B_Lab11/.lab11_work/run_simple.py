from pathlib import Path
import nbformat
from nbclient import NotebookClient
p=Path('Lab11_Solution_Simplified.ipynb');n=nbformat.read(p,4)
n.cells.append(nbformat.v4.new_code_cell("""import json
facts = {'accuracy': (df.vader_label == df.airline_sentiment).mean(), 'missed': int(missed.sum()),
         'repeat': float(repeat.mean()), 'families': families.round(1).to_dict(), 'reach': reach.round(2).to_dict(),
         'daily': daily.round(1).astype(str).to_dict()}
open('.lab11_work/simple_facts.json','w').write(json.dumps(facts,default=str))"""))
try: NotebookClient(n,timeout=600,kernel_name='python3').execute()
finally:
 n.cells=n.cells[:-1];nbformat.write(n,p)
print('Executed successfully:',p)
