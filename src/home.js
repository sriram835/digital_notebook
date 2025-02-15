const electron = require("electron");
const ipc = electron.ipcRenderer;

const editor = document.getElementById("editor");
const minimizeButton = document.getElementById("minimize");
const maximizeButton = document.getElementById("maximize");
const closeButton = document.getElementById("close");
const closeModal = document.getElementById("closeModal");
const saveFileDiv = document.getElementById("save-file");

const lineBreak = document.createElement("br");

document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();

  minimizeButton.addEventListener("click", () => {
    ipc.send("minimize");
  });

  maximizeButton.addEventListener("click", () => {
    ipc.send("maximize");
  });

  closeButton.addEventListener("click", () => {
    ipc.send("close");
  });

  closeModal.addEventListener("click", () => {
    saveFileDiv.style.display = `none`;
  });

  document
    .getElementById("save-btn")
    .addEventListener("click", async function () {
      saveFileDiv.style.display = `block`;
    });

  document
    .getElementById("save-details")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const content = document.getElementById("editor").innerHTML;
      const subject = document.getElementById("folder").value;
      const file = document.getElementById("file-name").value;
      console.log(subject, file);
      ipc.send("save-notes", content, subject, file);
    });
});

function loadSubjects() {
  ipc.send("load-subjects");
}

// Handle received subjects list
ipc.on("subjects-list", (event, subjects) => {
  const subjectsList = document.getElementById("subjects-list");
  subjectsList.innerHTML = "";

  subjects.forEach((subject) => {
    const button = document.createElement("button");
    button.textContent = subject;
    button.onclick = () => loadNotes(subject);
    subjectsList.appendChild(button);
  });
});

// Load notes from selected subject
function loadNotes(subject) {
  ipc.send("load-notes", subject);
}

// Handle received notes list
ipc.on("notes-list", (event, { subject, notes }) => {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";

  notes.forEach((note) => {
    const button = document.createElement("button");
    button.textContent = note;
    button.onclick = () => openNote(subject, note);
    notesList.appendChild(button);
  });
});

// Open a note when clicked
function openNote(subject, fileName) {
  ipc.send("open-note", subject, fileName);
}

// Display note content in editor
ipc.on("note-content", (event, content) => {
  console.log("Received note content:", content);
  editor.innerHTML = content;
});

ipc.on("from-main-cropped", (event, imgData) => {
  const img = document.createElement("img");
  img.setAttribute("src", imgData);
  img.setAttribute("class", "img");
  // Append image and line break to the notebook
  editor.appendChild(lineBreak);
  editor.appendChild(img);
  editor.appendChild(document.createElement("br")); // Another line break for spacing

  // Place cursor after the image
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStartAfter(img);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  // Focus back on the editor
  editor.focus();
});
