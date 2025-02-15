const electron = require("electron");
const app = electron.app;
const { globalShortcut, desktopCapturer, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const ipc = electron.ipcMain;
const fs = require("fs");

let win;
function createWindow() {
  win = new BrowserWindow({
    frame: true,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false, // Ensures the renderer has full access without disabling security
      enableRemoteModule: true,
      webviewTag: true, // Enables webview support
      devTools: true, // Allows debugging
    },
  });

  win.loadFile("./public/home.html");

  ipc.on("maximize", () => {
    const isFullScreen = win.isFullScreen();
    win.setFullScreen(!isFullScreen);
  });

  ipc.on("minimize", () => {
    win.minimize();
  });

  ipc.on("close", () => {
    win.close();
  });
  win.once("ready-to-show", () => {
    win.show();
  });
  win.on("closed", () => {
    win = null;
  });
}

app.on("ready", () => {
  createWindow();

  globalShortcut.register("CommandOrControl+Shift+S", () => {
    captureScreenshot();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipc.on("save-notes", (event, content, subject, file) => {
  const notesFilePath = path.join(
    app.getPath("userData"),
    "subjects",
    subject,
    file
  );
  fs.writeFile(notesFilePath, JSON.stringify({ content }), (err) => {
    if (err) console.error("Failed to save notes:", err);
  });
});

const subjectsDir = path.join(
  app.getPath("appData"),
  "digital_notebook",
  "subjects"
);

ipc.on("load-subjects", (event) => {
  const subjects = fs
    .readdirSync(subjectsDir)
    .filter((folder) =>
      fs.statSync(path.join(subjectsDir, folder)).isDirectory()
    );
  event.reply("subjects-list", subjects);
});

// Load notes from a selected subject
ipc.on("load-notes", (event, subject) => {
  const subjectPath = path.join(subjectsDir, subject);
  if (fs.existsSync(subjectPath)) {
    const notes = fs
      .readdirSync(subjectPath)
      .map((file) => path.basename(file, ".json"));
    event.reply("notes-list", { subject, notes });
  }
});

// Open a specific note
ipc.on("open-note", (event, subject, fileName) => {
  const filePath = path.normalize(path.join(subjectsDir, subject, fileName));

  console.log(`Checking file: ${filePath}`);

  if (fs.existsSync(filePath)) {
    const noteData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`Opened note: ${filePath}`);
    console.log(`Note Content: ${noteData.content}`);
    event.sender.send("note-content", noteData.content);
  } else {
    console.error(`❌ Note not found at: ${filePath}`);

    event.sender.send("note-content", "ERROR: Note not found.");
  }
});

let screenshotModal;

async function captureScreenshot() {
  const sources = await desktopCapturer.getSources({ types: ["screen"],thumbnailSize: {width: 7680, height: 3750} });
  const imgData = sources[0].thumbnail.toDataURL('image/jpeg', 1.0);
  
  if (sources.length > 0) {
    createChildWindow()
    ipc.on('child-ready', (event) => {
      screenshotModal.webContents.send('screenshot-data', imgData)
      console.log("the data is send")
    })
  }

}

function createChildWindow() {
  screenshotModal = new BrowserWindow({
    frame: true,
    parent: win,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  screenshotModal.loadFile("./public/screenshotModal.html");
}

ipc.on('cropped-screenshot', (event, imgData)=>{
  win.webContents.send('from-main-cropped', imgData);
  screenshotModal.close();
})