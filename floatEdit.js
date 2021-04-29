export default class floatEditor {
	editableElements;
	editor;
	injectCss = `
		[data-floatEdit] img {
			max-width: 300px
		}
		.floatEditor--editor {
			position: fixed;
			font-family: sans-serif;
			right: 10px;
			width: max-content;
			top: 10px;
			display: flex;
			flex-direction: row;
			background: #0e0e0e;
			border-radius: 5px;
			overflow: hidden;
			box-shadow: rgb(148 148 148) 0px 0px 5px;
			transition: 0.3s;
		}
		.floatEditor--editable {
			position: relative;
			border-left: 5px solid lightblue;
			min-height: 30px;
			transition: 0.3s;
			outline: none;
			margin-left: -10px;
			margin-bottom: 10px;
			padding-left: 5px;
		}
		.floatEditor--editable.in-edit {
			border-color: orange;
		}
	`;
	buttons = [
		{
			name: "reset",
			tag: "reset",
			command: () => document.execCommand("formatBlock", true, "<p>"),
		},
		{
			name: "h1",
			tag: "h1",
			command: () => document.execCommand("formatBlock", false, "<h1>"),
		},
		{
			name: "h2",
			tag: "h2",
			command: () => document.execCommand("formatBlock", false, "<h2>"),
		},
		{
			name: "h3",
			tag: "h3",
			command: () => document.execCommand("formatBlock", false, "<h3>"),
		},
		{
			name: "h4",
			tag: "h4",
			command: () => document.execCommand("formatBlock", false, "<h4>"),
		},
		{
			name: "b",
			tag: "b",
			command: () => document.execCommand("bold"),
		},
		{
			name: "i",
			tag: "i",
			command: () => document.execCommand("italic"),
		},
		{
			name: "u",
			tag: "u",
			command: () => document.execCommand("underline"),
		},
		{
			name: "li",
			tag: "li",
			command: () => document.execCommand("insertUnorderedList"),
		},
		{
			name: "a",
			tag: "a",
			command: () =>{
				let url = prompt("Url de lien hypertext");
				if (url == "" || !url) {
					return;
				} else {
					document.execCommand("createLink", false, url);
				}
			},
		},
		{
			name: "img",
			tag: "img",
			command: () => {
				let url = prompt("Url de l'image");
				if (url == "" || !url) {
					return;
				} else {
					document.execCommand("insertImage", false, url);
				}
			},
		},
		{
			name: "X",
			tag: "undo",
			command: () => document.execCommand("undo"),
		},
	];
	inSearch = true;
	commandSuggest = "";

	constructor(elementSelector) {
		this.editableElements = document.querySelectorAll(elementSelector);
		this.bindEditableContent();
		this.createEditor();
		let style = document.createElement("style");
		style.type = "text/css";
		if (style.styleSheet) {
			style.styleSheet.cssText = this.injectCss;
		} else {
			style.appendChild(document.createTextNode(this.injectCss));
		}
		document.getElementsByTagName("head")[0].appendChild(style);
	}

	bindEditableContent = () => {
		Array.from(this.editableElements).forEach((el) => {
			el.classList.add("floatEditor--editable");
			el.addEventListener("click", (e) => {
				el.contentEditable = true;
				el.classList.add("in-edit");
			});
			el.addEventListener("blur", (e) => {
				el.classList.remove("in-edit");
			});
			this.bindTogglerEvent(el);
		});
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				Array.from(this.editableElements).forEach((el) => {
					el.blur();
					el.contentEditable = false;
					el.classList.remove("in-edit");
				});
			}
		});
	};

	toggleCommandSearch = (event) => {
		let selection = window.getSelection();
		console.log('Ma sélection', selection)
		if (event.target.textContent.indexOf("/") < 0) {
			this.commandSuggest = "";
			this.inSearch = false;
		}
		if (this.inSearch) {
			if (event.key == "Enter") {
				event.preventDefault();
				if (this.commandAssociate[0] != undefined) {
					this.commandAssociate[0].command();
					this.commandSuggest = "";
				}
			}
			if (event.key == "Backspace") {
				this.commandSuggest = this.commandSuggest.substring(0, this.commandSuggest.length - 1);
				return this.searchCommand(this.commandSuggest);
			}
			if (event.key != 'Control' && event.key != 'Shift' && event.key != 'Tab' && event.key != 'Enter') {
				this.commandSuggest += event.key;
			}
			return this.searchCommand(this.commandSuggest);
		}
		if (event.key === "/" && event.key != 'Control') {
			this.inSearch = true;
		}
	};

	toggleEditor = (event) => {
		if (event.ctrlKey && event.code == "Space") {
			if (this.editor.style.display === "none") {
				return (this.editor.style.display = "flex");
			} else {
				return (this.editor.style.display = "none");
			}
		}
	};

	bindTogglerEvent = (element) => {
		element.addEventListener("keydown", (e) => {
			this.toggleEditor(e);
			this.toggleCommandSearch(e);
		});
	};

	searchCommand = (search) => {
		console.log(search)
		let tSearch = search.split("");
		let regex = "(.*)";
		tSearch.forEach((letter) => {
			regex += `(${letter})(.*)`;
		});
		console.log(regex)
		const Reg = new RegExp(regex, "gi");
		this.commandAssociate = this.buttons.filter((btn) => {
			if (Reg.test(btn.name)) {
				return btn;
			}
		});
	};

	createEditor = () => {
		const editorContainer = document.createElement("div");
		this.buttons.forEach((btn, index) => {
			editorContainer.innerHTML += `<button 
						style='border:1px solid rgba(255,255,255,0.2); padding: 5px 20px; background: #1e1e1e; color: #fafafa' 
						data-tag='${index}'>${btn.name}
					</button>`;
		});
		this.editor = editorContainer;
		this.editor.classList.add("floatEditor--editor");
		document.body.appendChild(editorContainer);
		editorContainer.querySelectorAll("button").forEach((btn) => {
			btn.addEventListener("click", () => this.addTag(btn));
		});
	};

	addTag = (tagButton) => {
		let index = tagButton.getAttribute("data-tag");
		let selection = window.getSelection()
		console.log(tagButton.textContent.trim())
		if (selection) {
			if (['h1', 'h2', 'h3', 'h4'].includes(this.buttons[index].tag) 
			&& ['h1', 'h2', 'h3', 'h4'].includes(selection.baseNode.parentNode.localName)) {
				return this.buttons[0].command()
			}
			this.buttons[index].command();
		}
	};
}
