class Command {
  /** @type {String} */
  #commandName;
  /** @type {commandHandler} */
  #handler = (args) => "";
  /** @type {Array<String>} */
  alias = [];

  /**
   * @typedef commandHandler
   * @param {Array<String>} args
   * @returns {String}
   */
  /**
   * @param {String} name
   * @param {commandHandler} handler
   * @param {Array<String>} alias
   */
  constructor(name, handler, alias = []) {
    this.#commandName = name;
    this.alias = alias;
    this.#handler = handler;
  }
  /** @returns {String} */
  get commandName() {
    return this.#commandName;
  }
  /**
   * @param {Array<String>} args
   * @returns {String}
   */
  run(args) {
    return this.#handler(args);
  }
}

class CommandList {
  /** @type {Map<String, Command>} */
  #map = new Map();

  /** @param {Command} cmd */
  addCommand(cmd) {
    let keys = [cmd.commandName];
    keys.push(...cmd.alias);

    for (let key of keys)
      this.#map.set(key, cmd);
  }

  /**
   * @param {String} name
   * @returns {Command}
   */
  getCommand(name) {
    return this.#map.get(name);
  }
}

class Shell {
  #element;
  /** @type {HTMLInputElement} */
  #lastInput;
  onsubmit = (input) => {};
  constructor(id = "shell") {
    this.#element = document.getElementById(id);
    this.#element.appendChild(this.createLine());
  }

  /** @returns {HTMLDivElement} */
  createLine() {
    let line = document.createElement("div");
    line.classList.add("line");

    let dir = document.createElement("span");
    dir.appendChild(document.createTextNode("~ $"));

    let commandInput = document.createElement("input");
    commandInput.classList.add("command");
    this.#lastInput = commandInput;
    commandInput.addEventListener("keyup", async (ev) => {
      if (ev.key === "Enter") {
        commandInput.replaceWith((() => {
          let s = document.createElement("span");
          s.classList.add("command");
          s.appendChild(document.createTextNode(commandInput.value));
          return s;
        })());
        await this.onsubmit(commandInput.value);
        this.addLine(this.createLine());
      }
    });

    line.appendChild(dir);
    line.appendChild(commandInput);

    commandInput.focus();

    return line;
  }

  /**
   * @param {HTMLDivElement} line
   * @returns {void}
   */
  addLine(line) {
    this.#element.appendChild(line);
    this.#lastInput.focus();
  }

  get shellElement() {
    return this.#element;
  }
}

const shell = new Shell("shell");
const commands = new CommandList;

commands.addCommand(new Command("echo", (args) => {
  let line = document.createElement("div");
  line.classList.add("line");
  line.appendChild(document.createTextNode(args.join(" ")));

  shell.addLine(line);
}, ["print", "e"]));
commands.addCommand(new Command("bg", (args) => {
  shell.shellElement.style.backgroundColor = args[0].toString();
}));
commands.addCommand(new Command("text-color", (args) => {
  shell.shellElement.style.setProperty("--text-color", args[0].toString());
}));
commands.addCommand(new Command("clear", () => {
  shell.shellElement.innerHTML = "";
  shell.addLine(shell.createLine());
}, ["cls"]));
commands.addCommand(new Command("curl", async (args) => {
  let line = document.createElement("div");
  try {
    const req = await fetch(args[0]);
    const result = await req.text();
    
    line.appendChild(document.createTextNode(result));
    shell.addLine(line);
  } catch (e) {
    line.appendChild(document.createTextNode(e));
  }
}));

shell.onsubmit = async function(input) {
  /** @type {Array<String>} */
  let args = input.split(" ");
  let commandName = args[0];
  const command = commands.getCommand(commandName);
  args.shift();

  if (!command) {
    this.addLine((() => {
      let line = document.createElement("div");
      line.classList.add("line");

      line.appendChild(document.createTextNode(`${commandName} not exist`));

      return line;
    })());
    return;
  }
  await command.run(args);
}