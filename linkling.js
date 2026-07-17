class Chain{
    constructor(words, starter, target){
        this.elements = [starter];
        this.add_chain_element(starter)
        this.target = target;
        this.found = [];
        this.words = words;
        this.undo_count = 0;
    }

    addWord(word){
        word = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        console.log(word);
        if (this.checkGuess(word)){
            this.elements.push(word);
            this.add_chain_element(word);
            if(this.target.includes(word.slice(-2))){
                this.found.push(word.slice(-2));
                let to_edit = document.getElementsByClassName("section_" + word.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].style.color = "green";
                }
                if(this.target.length === [...new Set(this.found)].length){
                    this.complete();
                }
            }
            return true;
        }
        return false;
    }

    complete(){
        let success_popup = document.getElementById('success');
        success_popup.style.display = 'flex';
        let summary = ""
        let score = this.elements.length + this.undo_count - 1;
        let point_breakdown = []
        point_breakdown.push("words: +" + (this.elements.length - 1).toString());
        point_breakdown.push("undos: +" + (this.undo_count).toString());
        let combo = 0;
        if(this.elements.length - 1 === this.target.length){
            combo++;
            point_breakdown.push("perfect: -" + this.target.length.toString());
            score -= this.target.length;
        }
        if(this.target === this.found){
            combo++;
            point_breakdown.push("in order: -" + this.target.length.toString());
            score -= this.target.length;
        }
        if(combo === 2){
            point_breakdown.push("Perfection! -1");
            score -= 1;
        }
        point_breakdown.push("score: " + score);
        for(let i = 0; i < point_breakdown.length; i++){
            let summary_element = document.createElement("h4")
            summary_element.innerText = point_breakdown[i];
            summary_element.classList.add("summary_element");
            success_popup.appendChild(summary_element);
        }
        let share_text = "Linkling " + new Date().toDateString() + ":\n" + point_breakdown.join("\n");
        let share_button = document.createElement("button");
        share_button.innerText = "share";
        share_button.id = "share_button";
        share_button.addEventListener("click", function(){
            navigator.clipboard.writeText(share_text).then(r => share_button.innerText = "copied");
        })
        success_popup.appendChild(share_button);
        let chain_text = document.createElement("h5");
        chain_text.innerText = this.elements.join(" -> ");
        chain_text.id = "chain_text";
        success_popup.appendChild(chain_text);
    }

    add_chain_element(word){
        let new_word = document.createElement("h3");
        new_word.innerText = word;
        new_word.id = "chain_element_" + this.elements.length;
        new_word.classList.add("chain_element")
        document.getElementById("chain-container").appendChild(new_word);
    }

    display_error(text){
        let message = document.createElement("h3");
        message.innerText = text;
        message.classList.add("error");
        document.getElementById("chain-container").appendChild(message);
        setTimeout(function(){
            message.remove();
        }, 2000);
    }

    checkGuess(guess){
        if(!this.words.includes(guess)) {
            this.display_error("not in word list, sorry")
            return false;
        }
        let latest = this.elements[this.elements.length - 1];
        if(checkOverlap(latest, guess) === false){
            this.display_error("that doesn't overlap with " + latest)
            return false;
        }
        return true;
    }

    undo(){
        if(this.elements.length <= 1){
            return false;
        }
        document.getElementById("chain_element_" + this.elements.length).remove();
        let latest = this.elements.pop()

        if(this.target.includes(latest.slice(-2))){
            this.found.pop()
            if(this.found.includes(latest.slice(-2)) === false){
                let to_edit = document.getElementsByClassName("section_" + latest.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].style.color = "aquamarine";
                }
            }
        }
        this.undo_count++;
        return true;
    }
}


async function getWords(wordlist){
    let data = await fetch(wordlist);
    let words = await data.text();
    words = words.split("\r\n").slice(26, -1);
    for (let i = 0; i < words.length; i++) {
        words[i] = words[i].replace(/[^a-zA-Z0-9]/g, "");
    }
    return words;
}

function get_possible_targets(even_words, words, target_length){
    let split_even_words = [];
    for(let i = 0; i < even_words.length; i++){
        split_even_words.push([]);
        for(let j = 0; j < even_words[i].length; j+=2){
            split_even_words[i].push(even_words[i][j] + even_words[i][j+1]);
        }
    }
    even_words = split_even_words.filter(function(word){return word.length === target_length && [...new Set(word)].length === target_length});
    // achievable endings from wordlist
    let end_pairs = [...new Set(words.map((word) =>{return word.slice(-2)}))].filter(function(word){return word.length === 2})
    // filter out words with unreachable pairs
    even_words = even_words.filter(function(even_word){
        for(let i = 0; i < even_word.length; i++){
            if(end_pairs.includes(even_word[i]) === false){
                return false
            }
        }
        return true;
    });
    return even_words;
}

function generatePuzzle(words, even_words, target_length, seed){
    words = fisherYatesShuffle(words, seed);
    let possible_targets = get_possible_targets(even_words, words, target_length);
    let start = ""
    let target = []
    let attempts = 0;
    while (target.length === 0){
        start = words[attempts];
        attempts++;
        let frontier = [[start, [start], possible_targets.filter(function(word){
            return word.includes(start.slice(-2)) === false;
        })]];
        let explored = new Set([start]);
        while(frontier.length > 0){
            let current = frontier.shift();
            let current_word = current[0];
            let current_path = current[1];
            let current_available = current_path.map(word => word.slice(-2)).slice(1);
            let current_targets = current[2]
            if(explored.size > 1){
                current_targets = current[2].filter(function(word){
                    return word.includes(current_word.slice(-2)) !== false;
                })
            }
            let available_words = []
            if(current_available.length === target_length){
                available_words = checkForWord(current_available, current_targets);
            }
            if(available_words.length > 0){
                target = available_words[0]
                console.log(current_path)
                return [start, target]
            }
            if(current_path.length - 1 < target_length){
                let required = getRequiredPairs(current_targets, current_available);
                for(let i=0;i<words.length;i++){
                    let word = words[i];
                    if(required.has(word.slice(-2)) === false || explored.has(word)){
                        continue;
                    }
                    if(checkOverlap(current_word, word)){
                        explored.add(word)
                        frontier.unshift([word, [...current_path, word], current_targets])
                    }
                }
            }

        }
    }
}

function getRequiredPairs(possible_targets, current_available){

    let needed = new Set(possible_targets.flat())
    for(let i = 0; i < current_available.length; i++){
        needed.delete(current_available[i]);
    }
    return needed
}

function fisherYatesShuffle(arr, seed) {
    const random = mulberry32(seed);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function mulberry32(seed) {
    return function() {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}


function checkOverlap(first, second){
    for (let i = 2; i <= Math.min(first.length, second.length - 1); i++){
        if(first.slice(-i) === second.slice(0, i)){
            return true;
        }
    }
    return false;
}

function checkForWord(word, wordlist){
    let checker = (candidate) => candidate.every(v => word.includes(v));
    return wordlist.filter(checker);
}


async function setup(wordlist){
    let words = await getWords(wordlist);
    let even_words = words.filter(function(word){
        return word.length % 2 === 0;
    })
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();
    let puzzle = generatePuzzle(words, even_words, 5, parseInt(dd+mm+yyyy));
    let chain = new Chain(words, puzzle[0], puzzle[1]);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i];
        section.classList.add("target");
        section.classList.add("section_" + puzzle[1][i])
        document.getElementById("target-container").appendChild(section);
    }
    document.getElementById("input-box").onkeydown = function(e){
        if(e.code === "Enter"){
            chain.addWord(document.getElementById("input-box").value);
            document.getElementById("input-box").value = "";
        }
    }
    document.getElementById("submit-button").onclick = function(){
        chain.addWord(document.getElementById("input-box").value);
        document.getElementById("input-box").value = "";
    }
    document.getElementById("undo-button").onclick = function(){
        chain.undo()
    }
}

