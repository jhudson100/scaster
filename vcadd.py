#!/usr/bin/env python3

import sys
import fnmatch
import subprocess
import os
import os.path


ext="""*.java *.c *.cpp *.h *.py *.js *.css *.html LICENSE *.md *.txt build.xml
manifest.mf build-impl.xml *.properties project.xml Makefile *.png
*.rst *.dot *.svg *.tex *.ts tsconfig.json *.cs *.sln *.csproj *.ini
"""

dry_run=False
walkdir = "."

for a in sys.argv[1:]:
    if a == "--dry-run":
        dry_run=True
    else:
        walkdir = a


ext = ext.strip().split()

toAdd = []
for dirpath,dirs,files in os.walk(walkdir):
    for f in files:
        for e in ext:
            if fnmatch.fnmatch(f,e):
                toAdd.append( os.path.join(dirpath,f) )
                
cmd = ["git","add"] + toAdd
print(" ".join(cmd))

if not dry_run:
    subprocess.check_call(cmd)

