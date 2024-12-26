export const keyToCode = JSON.parse(`{
  "0": "Digit0",
  "1": "Digit1",
  "2": "Digit2",
  "3": "Digit3",
  "4": "Digit4",
  "5": "Digit5",
  "6": "Digit6",
  "7": "Digit7",
  "8": "Digit8",
  "9": "Digit9",
  "unk": "Unidentified",
  "mouse1": "Unidentified",
  "mouse2": "Unidentified",
  "break": "Unidentified",
  "mouse3": "Unidentified",
  "mouse4": "Unidentified",
  "mouse5": "Unidentified",
  "Backspace": "Backspace",
  "tab": "Tab",
  "clear": "Clear",
  "Enter": "Enter",
  "Shift": "Shift",
  "Ctrl": "Control",
  "Alt": "Alt",
  "Pause": "Pause",
  "capslock": "CapsLock",
  "imehangul": "HangulMode",
  "imejunja": "JunjaMode",
  "imefinal": "FinalMode",
  "imekanji": "KanjiMode",
  "Escape": "Escape",
  "imeconvert": "Convert",
  "imenonconvert": "Convert",
  "imeaccept": "Accept",
  "imemodechange": "ModeChange",
  "Space": "Space",
  "pageup": "PageUp",
  "pagedown": "PageDown",
  "end": "End",
  "home": "Home",
  "ArrowLeft": "ArrowLeft",
  "ArrowUp": "ArrowUp",
  "ArrowRight": "ArrowRight",
  "ArrowDown": "ArrowDown",
  "Select": "Select",
  "Print": "Print",
  "execute": "Execute",
  "snapshot": "PrintScreen",
  "insert": "Insert",
  "Delete": "Delete",
  "help": "Help",
  ":": "Semicolon",
  ";": "Semicolon",
  "<": "Comma",
  "=": "Equal",
  ">": "Period",
  "?": "Slash",
  "@": "Digit0",
  "a": "KeyA",
  "b": "KeyB",
  "c": "KeyC",
  "d": "KeyD",
  "e": "KeyE",
  "f": "KeyF",
  "g": "KeyG",
  "h": "KeyH",
  "i": "KeyI",
  "j": "KeyJ",
  "k": "KeyK",
  "l": "KeyL",
  "m": "KeyM",
  "n": "KeyN",
  "o": "KeyO",
  "p": "KeyP",
  "q": "KeyQ",
  "r": "KeyR",
  "s": "KeyS",
  "t": "KeyT",
  "u": "KeyU",
  "v": "KeyV",
  "w": "KeyW",
  "x": "KeyX",
  "y": "KeyY",
  "z": "KeyZ",
  "meta": "Meta",
  "menu": "ContextMenu",
  "sleep": "Standby",
  "num0": "Unidentified",
  "num1": "Unidentified",
  "num2": "Unidentified",
  "num3": "Unidentified",
  "num4": "Unidentified",
  "num5": "Unidentified",
  "num6": "Unidentified",
  "num7": "Unidentified",
  "num8": "Unidentified",
  "num9": "Unidentified",
  "num*": "Unidentified",
  "num+": "Unidentified",
  "numenter": "Unidentified",
  "num-": "Unidentified",
  "num.": "Unidentified",
  "num/": "Unidentified",
  "f1": "F1",
  "f2": "F2",
  "f3": "F3",
  "f4": "F4",
  "f5": "F5",
  "f6": "F6",
  "f7": "F7",
  "f8": "F8",
  "f9": "F9",
  "f10": "F10",
  "f11": "F11",
  "f12": "F12",
  "f13": "F13",
  "f14": "F14",
  "f15": "F15",
  "f16": "F16",
  "f17": "F17",
  "f18": "F18",
  "f19": "F19",
  "f20": "F20",
  "f21": "F21",
  "f22": "F22",
  "f23": "F23",
  "f24": "F24",
  "numlock": "NumLock",
  "scrolllock": "ScrollLock",
  "shiftleft": "ShiftLeft",
  "shiftright": "ShiftRight",
  "ctrlleft": "ControlLeft",
  "ctrlright": "ControlRight",
  "AltLeft": "AltLeft",
  "altright": "AltRight",
  "metaleft": "MetaLeft",
  "metaright": "MetaRight",
  "browserback": "Unidentified",
  "browserforward": "Unidentified",
  "browserrefresh": "Unidentified",
  "browserstop": "Unidentified",
  "browsersearch": "Unidentified",
  "browserfavorites": "Unidentified",
  "browserhome": "Unidentified",
  "volumemute": "Unidentified",
  "volumedown": "Unidentified",
  "volumeup": "Unidentified",
  "nexttrack": "Unidentified",
  "prevtrack": "Unidentified",
  "stop": "Unidentified",
  "playpause": "Unidentified",
  "launchmail": "Unidentified",
  "launchmediaselect": "Unidentified",
  "launchapp1": "Unidentified",
  "launchapp2": "Unidentified",
  ",": "Comma",
  "-": "Minus",
  ".": "Period",
  "/": "Slash",
  "\`": "Backquote",
  "[": "BracketLeft",
  "\\\\": "Backslash",
  "]": "BracketRight",
  "'": "Quote",
  "altgr": 226,
  "imeprocess": "Process",
  "unicode": "CodeInput",
  "attention": "Attn",
  "crsel": 247,
  "exsel": "ExSel",
  "eraseeof": "EraseEof",
  "play": 250,
  "zoomin": "ZoomIn",
  "zoomout": "ZoomOut",
  "noname": 252,
  "pa1": 253
}`)

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'
export const DIGIT = '0123456789'
export const SYMBOL = `\`~|\\^{}+×÷=/_<>≤≥[]!@#$%&*()-'":;,.?`

export const ALPHA_NUMERIC = ALPHABET + DIGIT

export const CHARACTER = DIGIT + ALPHABET + SYMBOL

export function isAlphaNumeric(key: string): boolean {
  return ALPHA_NUMERIC.includes(key.toLowerCase())
}

export function isAlphabetChar(key: string): boolean {
  return ALPHABET.includes(key.toLowerCase())
}

export function isSymbol(key: string): boolean {
  return SYMBOL.includes(key)
}

export function isNotSymbol(key: string): boolean {
  return !isSymbol(key)
}

export function isChar(key: string): boolean {
  return CHARACTER.includes(key.toLowerCase())
}
