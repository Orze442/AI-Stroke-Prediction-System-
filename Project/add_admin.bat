@echo off

REM Navigate to the virtual environment's Scripts folder
cd /d "C:\FYP\Project\websites\Scripts"

REM Activate the virtual environment
call activate

REM Navigate to the project root where 'backend' is a package
cd /d "C:\FYP\Project"

REM Run the Python module using the correct import context
python -m backend.main_models.add_test_user

REM Keep the terminal open to view output
pause