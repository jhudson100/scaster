

all:
	tsc

run:
	node -r /usr/lib/node_modules/source-map-support/register 
	
clean:
	-/bin/rm -r bin
	
