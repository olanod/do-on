const moduleFromString = async str => import(
	URL.createObjectURL(new Blob([str], {type: 'application/javascript'}))
)

const removeSiblings = ele => {
	while (ele.previousSibling) ele.previousSibling.remove()
	while (ele.nextSibling) ele.nextSibling.remove()
}

const isJSON = s => typeof s === 'string' && (s.startsWith('[') || s.startsWith('{'))

export class On extends HTMLTemplateElement {
	#chan
	#script
	#onMsg = ({data}) => {
		data = isJSON(data) ? JSON.parse(data) : data
		data = data.map(d => {
			this.updateContent(this.content, d)
			return this.content.cloneNode(true)
		})
		requestAnimationFrame(() => {
			if (this.mode === 'replace') removeSiblings(this)
			this.parentElement.append(...data)
		})
	}

	mode = 'append'
	channel = ''
	updateContent = () => {}

	constructor() {
		super()
		this.#script = this.content.querySelector('script')
		this.content.removeChild(this.#script)
		this.channel = this.getAttribute('channel')
		if (this.channel)
			this.#chan = new BroadcastChannel(this.channel)
	}

	async connectedCallback() {
		if (this.#script) {
			let {update} = await moduleFromString(this.#script.textContent)
			this.updateContent = update
		}
		if (this.#chan)
			this.#chan.addEventListener('message', this.#onMsg)
	}
}
customElements.define('do-on', On, {extends: 'template'})
