@echo off
REM STEP 1: Activate Python virtual environment and run FastAPI server
start cmd /k "cd /d C:\FYP\Project\websites\Scripts && call activate && cd /d C:\FYP\Project\backend && uvicorn main:app --reload"

REM STEP 2: Open a new terminal for React frontend
start cmd /k "cd /d C:\FYP\Project\frontend && npm start"