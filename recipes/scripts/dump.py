import json,sys
d=json.load(open('recipes_es.json'))['recipes']
a,b=int(sys.argv[1]),int(sys.argv[2])
for i,r in enumerate(d[a:b],a):
    print(f"={i} {r['id']} | {r['title_es']}")
    for g in r['ingredients']:
        if g['group']: print('##',g['group'])
        for it in g['items']: print('-',it)
    for s in r['steps']: print('>',s)
    for n in r['notes']: print('!',n)
    for n in r['uncertain']: print('?',n)
