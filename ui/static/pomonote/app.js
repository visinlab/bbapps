const { createApp } = Vue

const taskData = [
    "2025-11-25 (A) Finish the quarterly report +visinlab g:dev.ui @bb10 @play pp:4 pd:2 dp:2025-11-26 tp:09:00",
    "2025-11-25 (B) Do another task +visinlab g:dev.ui @bb10 @play pp:4 pd:1 dp:2025-11-26 tp:09:30",
    "2025-11-25 (A) Do yet another task +visinlab g:dev.ui @bb10 @test pp:4 pd:0 dp:2025-11-26 tp:09:00",
]

createApp({
    
    data() { return {
        inputModeOn: false,
        workspaces: [],
        projects: [],
        tasks: [],
        focusedIndex: -1,
        input: '',
        appendMode: false
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
            // key a: append data to focused item
            if (event.key === 'a' && this.focusedIndex >= 0 && this.tasks[this.focusedIndex]) {
                event.preventDefault();
                event.stopPropagation();
                this.inputModeOn = true;
                var inputRef = this.$refs.inputRef;
                this.$nextTick(() => {
                    inputRef.focus();
                });
                // mark append mode
                this.appendMode = true;
                return;
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
            if (event.key === 'f') {
                event.preventDefault()
                console.log('adding 5 tasks')
                for (var i=0; i<5; i++) {
                    this.tasks.push({ name: 'Task' + i})
                }
                return
            }
            // additional key bindings for selected list item
            if (this.focusedIndex >= 0 && this.tasks[this.focusedIndex]) {
                const task = this.tasks[this.focusedIndex];
                if (!task.meta) task.meta = {};
                // key p: increase pp
                if (event.key === 'p') {
                    event.preventDefault();
                    let pp = parseInt(task.meta.pp || 0, 10);
                    pp++;
                    task.meta.pp = pp;
                    this.$forceUpdate();
                    return;
                }
                // key d: increase pd, and if pp < pd, increase pp as well
                if (event.key === 'd') {
                    event.preventDefault();
                    let pd = parseInt(task.meta.pd || 0, 10);
                    pd++;
                    task.meta.pd = pd;
                    let pp = parseInt(task.meta.pp || 0, 10);
                    if (pp < pd) {
                        pp = pd;
                        task.meta.pp = pp;
                    }
                    task.meta.pd = pd;
                    this.$forceUpdate();
                    return;
                }
               // key o: decrease pp, min 0
               if (event.key === 'o') {
                   event.preventDefault();
                   let pp = parseInt(task.meta.pp || 0, 10);
                   pp = Math.max(0, pp - 1);
                   task.meta.pp = pp;
                   this.$forceUpdate();
                   return;
               }
               // key s: decrease pd, min 0
               if (event.key === 's') {
                   event.preventDefault();
                   let pd = parseInt(task.meta.pd || 0, 10);
                   pd = Math.max(0, pd - 1);
                   task.meta.pd = pd;
                   this.$forceUpdate();
                   return;
               }
               // key x: delete focused task
               if (event.key === 'x') {
                   event.preventDefault();
                   this.tasks.splice(this.focusedIndex, 1);
                   // adjust focusedIndex after deletion
                   if (this.tasks.length === 0) {
                       this.focusedIndex = -1;
                   } else if (this.focusedIndex >= this.tasks.length) {
                       this.focusedIndex = this.tasks.length - 1;
                   }
                   this.$forceUpdate();
                   return;
               }
            }
        },
        // helper to merge parsed fields into an existing task
        mergeTaskFields(target, parsed) {
            // update description: replace if provided
            if (parsed.description) {
                target.description = parsed.description;
            }
            // update projects
            if (parsed.projects && parsed.projects.length) {
                target.projects = Array.from(new Set([...(target.projects || []), ...parsed.projects]));
            }
            // update contexts
            if (parsed.contexts && parsed.contexts.length) {
                target.contexts = Array.from(new Set([...(target.contexts || []), ...parsed.contexts]));
            }
            // update meta fields
            if (parsed.meta) {
                target.meta = Object.assign({}, target.meta || {}, parsed.meta);
            }
            // update priority
            if (parsed.priority) target.priority = parsed.priority;
            // update due
            if (parsed.due) target.due = parsed.due;
        },
        customParseTask(text) {
            // Remove leading + signs from the start of the line
            text = text.replace(/^\++\s*/, '');
            // Get current date in YYYY-MM-DD
            const pad = n => n < 10 ? '0' + n : n;
            const now = new Date();
            const creationDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

            // Helper to get date string for keywords
            function getDateForKeyword(keyword) {
                const d = new Date(now);
                switch (keyword) {
                    case 'td': // today
                        break;
                    case 'tm': // tomorrow
                        d.setDate(d.getDate() + 1);
                        break;
                    case 'atm': // day after tomorrow
                        d.setDate(d.getDate() + 2);
                        break;
                    case 'we': // next Saturday
                        d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
                        break;
                    case 'nw': // next Monday
                        d.setDate(d.getDate() + ((1 - d.getDay() + 7) % 7 || 7));
                        break;
                    case 'nwe': // saturday after next saturday
                        {
                            // first next saturday
                            let firstSaturday = new Date(d);
                            firstSaturday.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
                            // saturday after next saturday
                            firstSaturday.setDate(firstSaturday.getDate() + 7);
                            d.setTime(firstSaturday.getTime());
                        }
                        break;
                   default:
                       return null;
               }
               return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
           }

            // Improved: split by tags, but if p: is found, do not append to description
            let desc = '';
            let tags = [];
            const tagRegex = /\s([a-zA-Z]+:[^ ]+)/g;
            let tagMatch;
            let tagIndices = [];
            while ((tagMatch = tagRegex.exec(text)) !== null) {
                tagIndices.push(tagMatch.index);
            }
            if (tagIndices.length > 0) {
                desc = text.slice(0, tagIndices[0]).trim();
                tags = text.slice(tagIndices[0]).trim().split(/\s+/);
            } else {
                desc = text.trim();
            }
            // If p: is present as first tag, do not append to description
            if (tags.length && tags[0].startsWith('p:')) {
                // If desc contains p: accidentally, remove it
                desc = desc.replace(/\bp:[^\s]+/, '').trim();
            }

            let obj = {
                raw: text,
                completed: false,
                creationDate,
                priority: null,
                description: desc,
                projects: [],
                contexts: [],
                meta: {},
                due: null
            };

            tags.forEach(tag => {
                if (tag.startsWith('p:')) {
                    // p:aaa.bb.cc => project: aaa, g: bb.cc
                    const val = tag.slice(2);
                    const parts = val.split('.');
                    if (parts.length > 1) {
                        obj.projects.push(parts[0]);
                        obj.meta.g = parts.slice(1).join('.');
                    } else {
                        obj.projects.push(val);
                    }
                    // Remove p:... from description if present
                    obj.description = obj.description.replace(/\bp:[^\s]+/, '').trim();
                } else if (tag.startsWith('pr:')) {
                    obj.priority = tag.slice(3).toUpperCase();
                } else if (tag.startsWith('l:')) {
                    obj.contexts = tag.slice(2).split(',').map(s => s.trim()).filter(Boolean);
                } else if (tag.startsWith('dp:')) {
                    obj.due = tag.slice(3);
                    let val = tag.slice(3).trim();
                    const kwDate = getDateForKeyword(val);
                    if (kwDate) {
                        obj.due = kwDate;
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                        obj.due = val;
                    } else {
                        obj.due = creationDate;
                    }
                } else {
                    const kv = tag.match(/^([a-zA-Z0-9_.-]+):(.+)$/);
                    if (kv) obj.meta[kv[1]] = kv[2];
                }
            });

            // If due is not set, use creation date
            if (!obj.due) obj.due = creationDate;
            return obj;
        },
        parseTask(line) {
            const obj = {
                raw: line,
                completed: false,
                completionDate: null,
                creationDate: null,
                priority: null,
                description: '',
                projects: [],
                contexts: [],
                meta: {}
            }

            if (!line || typeof line !== 'string') return obj
            const tokens = line.trim().split(/\s+/)
            let i = 0

            // completed marker "x"
            if (tokens[i] === 'x') {
                obj.completed = true
                i++
                // possible completion date next
                if (tokens[i] && /^\d{4}-\d{2}-\d{2}$/.test(tokens[i])) {
                    obj.completionDate = tokens[i]
                    i++
                }
            }

            // creation date (optional, YYYY-MM-DD)
            if (tokens[i] && /^\d{4}-\d{2}-\d{2}$/.test(tokens[i])) {
                obj.creationDate = tokens[i]
                i++
            }

            // priority (optional) like (A)
            if (tokens[i] && /^\([A-Z]\)$/.test(tokens[i])) {
                obj.priority = tokens[i].slice(1,2)
                i++
            }

            // remaining tokens: description + meta key:value + +projects +@contexts
            const desc = []
            for (; i < tokens.length; i++) {
                const t = tokens[i]
                const kv = t.match(/^([A-Za-z0-9_.-]+):(.+)$/)
                if (kv) {
                    obj.meta[kv[1]] = kv[2]
                    continue
                }
                if (t[0] === '+') {
                    obj.projects.push(t.slice(1))
                    continue
                }
                if (t[0] === '@') {
                    obj.contexts.push(t.slice(1))
                    continue
                }
                desc.push(t)
            }
            obj.description = desc.join(' ')

            // map common meta keys to nicer top-level properties
            if (obj.meta.dp) obj.due = obj.meta.dp
            if (obj.meta.dp || obj.meta.due) obj.due = obj.due || obj.meta.due
            
            console.log('parsed task:', obj)
            return obj
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
                this.appendMode = false;
                return
            }

            if (this.appendMode && this.focusedIndex >= 0 && this.tasks[this.focusedIndex]) {
                // append to focused item
                const parsed = this.customParseTask(text);
                this.mergeTaskFields(this.tasks[this.focusedIndex], parsed);
                this.appendMode = false;
                this.inputModeOn = false;
                this.$forceUpdate();
                // after update, focus the same edited item
                this.$nextTick(() => {
                    this.focusItem(this.focusedIndex);
                });
            } else {
                this.createTask(text)
            }
        },
        createTask(text) {
            // Use custom parser for new input
            const parsed = this.customParseTask(text);
            this.tasks.push(parsed);
            // after DOM update, scroll the newly added item (last) into view but keep focus in the input
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
         // initialize tasks by parsing sample taskData
         if ((!this.tasks || this.tasks.length === 0) && Array.isArray(taskData)) {
             this.tasks = taskData.map(t => this.parseTask(t))
         }
    },
    beforeUnmount() {
        document.removeEventListener("keydown", this.onKeyDown);
    }
}).mount('#app')
