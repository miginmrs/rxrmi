if [ `git branch --show-current` != 'master' ]; then
  echo 'you are not in master branch' >&2
  exit -1
fi
yarn dist || exit -1
yarn test:js || exit -1
rm -rf temp/*
cp -r typings dist/cjs/
mv dist temp/
mv bundles temp/
git checkout builds || exit -1
rm -rf bundles dist
cp -r temp/* ./
git checkout master README.md &&
git checkout master LICENSE.txt &&
git checkout master source &&
git checkout master utils &&
git checkout master typings &&
git checkout master inc-version.js &&
git checkout master package.json &&
git restore --staged . &&
node inc-version.js &&
git add . &&
if [ `git log -1 --pretty=%B` = `cat version.out` ]; then
  git commit -C HEAD --amend
else
  git commit -F version.out
fi &&
rm version.out &&
git push -f
git checkout .
git checkout master
rm -rf bundles dist
mv temp/* ./
