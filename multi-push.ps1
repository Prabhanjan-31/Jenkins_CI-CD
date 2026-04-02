for ($i=1; $i -le 5; $i++) {
  Add-Content test.txt "change $i"
  git add .
  git commit -m "auto push $i"
  git push

  Start-Sleep -Milliseconds 500
}