const { createApp } = Vue

createApp({
    
    data() { return {
        inputModeOn: false,
        workspaces: [],
        projects: [],
        tasks: [],
        focusedIndex: -1,
        input: ''
    }},

    methods: {
        onKeyDown(event) {
            //console.log(event.key)
            if (this.inputModeOn == true) return
            // global navigation when not in input mode
            if (event.key == 'n') {
                event.preventDefault()
                event.stopPropagation()
                this.inputModeOn = true
                var inputRef = this.$refs.inputRef
                this.$nextTick(() => {
                    inputRef.focus()
                })
                return
            }
            
            // navigate with j/k when not in input mode
            if (event.key === 'j') {
                event.preventDefault()
                this.focusNext()
                return
            }
            if (event.key === 'k') {
                event.preventDefault()
                this.focusPrev()
                return
            }
        },
        focusItem(index) {
            if (!this.tasks || this.tasks.length === 0) return
            const raw = this.$refs.taskItems || []
            let items = Array.isArray(raw) ? raw : [raw]
            index = Math.max(0, Math.min(index, items.length - 1))
            const el = items[index]
            if (el && typeof el.focus === 'function') {
                el.focus()
                this.focusedIndex = index
            }
        },
        focusNext() {
            if (!this.tasks || this.tasks.length === 0) return
            const next = (this.focusedIndex < 0) ? 0 : Math.min(this.focusedIndex + 1, this.tasks.length - 1)
            this.focusItem(next)
        },
        focusPrev() {
            if (!this.tasks || this.tasks.length === 0) return
            const prev = (this.focusedIndex <= 0) ? 0 : this.focusedIndex - 1
            this.focusItem(prev)
        },
        onItemClick(idx) {
            this.focusItem(idx)
        },
        onInputEnter() {
             let text = this.input
             if (text) text = text.trim()
             this.input = ''
 
             if (text.length == 0) {
                 this.inputModeOn = false
                 return
             }
 
             this.createTask(text)
         },
         createTask(text) {
             this.tasks.push({ name: text })
            // after DOM update, scroll the newly added item (last) into view
            // but keep focus in the input
            this.$nextTick(() => {
                const raw = this.$refs.taskItems || []
                const items = Array.isArray(raw) ? raw : [raw]
                const last = items[items.length - 1]
                if (last && typeof last.scrollIntoView === 'function') {
                    last.scrollIntoView({ behavior: 'auto', block: 'nearest' })
                }
                const inputRef = this.$refs.inputRef
                if (inputRef && typeof inputRef.focus === 'function') {
                    inputRef.focus()
                }
            })
         }
     },
    watch: {
        inputModeOn(newVal) {
            if (!newVal) {
                // when leaving input mode, focus the first item (if any)
                this.$nextTick(() => {
                    if (this.tasks && this.tasks.length > 0) this.focusItem(0)
                })
            }
        }
    },
 
    mounted() {
         document.addEventListener("keydown", this.onKeyDown);
    },
    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeyDown);
    }
}).mount('#app')
