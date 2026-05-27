!macro customInstall
  nsExec::ExecToLog 'powershell -ExecutionPolicy Bypass -File "$INSTDIR\resources\add-path.ps1"'
!macroend
