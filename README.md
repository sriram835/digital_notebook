# Digital NoteBook

## The notebook can be used to:

1. Write notes
2. Take screenshots and add them to notes
3. Save notes and load saved notes

## How it works

- The editor or note-writing section works by using 'div' with 'editablecontent=true'. The inner HTML of the div is saved as a JSON file in "C:\Users\"YOUR USERNAME"\AppData\Roaming\digital_notebook\subjects". Inside the subjects folder create folders for each subject.
- The screenshot feature works using desktop capture. The screenshot is sent to a modal window to select the area to crop (since the screen is always fullscreen). Click LMB two times to select the two points at diagonals of a rectangular area, which gets cropped and is sent to the main.js file and then to the main window or notebook window which is then added to the notes/editor div 
