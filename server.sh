#$(npm bin)/nodemon --inspect app --debug --ns1 --image-colors 2 --date ${1:-"1999-12-31"}
#$(npm bin)/nodemon --inspect app --debug --ns1 --image-colors 2 --date ${1:-"1996-12-20"}
$(npm bin)/nodemon --inspect app --debug --ns1 --image-colors 2 --resolve-missing --no-cache --date ${1:-"1996-11-02"}
