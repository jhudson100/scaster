#!/usr/bin/env python3

# ~ Copyright 2020 J Hudson
# ~  
# ~ Licensed under the Apache License, Version 2.0 (the "License");
# ~ you may not use this file except in compliance with the License.
# ~ You may obtain a copy of the License at
# ~ 
# ~     https://www.apache.org/licenses/LICENSE-2.0
# ~ 
# ~ Unless required by applicable law or agreed to in writing, software
# ~ distributed under the License is distributed on an "AS IS" BASIS,
# ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# ~ See the License for the specific language governing permissions and
# ~ limitations under the License.


import sys
import fnmatch
import subprocess
import os
import os.path


ext="""*.java *.c *.cpp *.h *.py *.js *.css *.html LICENSE *.md *.txt build.xml
manifest.mf build-impl.xml *.properties project.xml Makefile *.png
*.rst *.dot *.svg *.tex *.ts tsconfig.json *.cs *.sln *.csproj *.ini
"""

ignore=["bin",".git"]

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
    for ex in ignore:
        try:
            i=dirs.index(ex)
            del dirs[i]
        except ValueError:
            pass
            
    for f in files:
        for e in ext:
            if fnmatch.fnmatch(f,e):
                toAdd.append( os.path.join(dirpath,f) )
                
cmd = ["git","add"]
if dry_run:
    cmd.append("--dry-run")
cmd += toAdd
print(" ".join(cmd))
subprocess.check_call(cmd)

