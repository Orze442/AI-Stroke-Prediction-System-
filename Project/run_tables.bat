@echo off
REM Navigate to the virtual environment's Scripts folder
cd /d "C:\FYP\Project\websites\Scripts"

REM Activate the virtual environment
call activate

REM Navigate to the script's directory
cd /d "C:\FYP\Project\backend\main_models"

REM Run the Python script
python tables.py

REM Keep the terminal open to view output
pause