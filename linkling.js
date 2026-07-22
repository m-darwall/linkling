class Chain{
    constructor(words, starter, target, found_path){
        this.elements = [starter];
        this.add_chain_element(starter, 0, false)
        this.target = target;
        this.found = [];
        this.words = words;
        this.undo_count = 0;
        this.optimum = found_path;
    }

    addWord(word){
        word = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        let check = this.checkGuess(word);
        if (check !== false){
            this.elements.push(word);
            if(this.target.includes(word.slice(-2))){
                this.add_chain_element(word, check, true);
                this.found.push(word.slice(-2));
                let to_edit = document.getElementsByClassName("section_" + word.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].style.color = "green";
                }
                if(this.target.length === [...new Set(this.found)].length){
                    this.complete();
                }
            } else{
                this.add_chain_element(word, check, false);
            }
            return true;
        }
        return false;
    }

    complete(){
        let success_popup = document.getElementById('success');
        success_popup.style.display = 'flex';
        let score = this.elements.length + this.undo_count - 1;
        let point_breakdown = []
        let emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        let emoji_summary = ""
        for(let i = 1; i < this.elements.length; i++){
            if(this.target.includes(this.elements[i].slice(-2))){
                emoji_summary += emoji[this.target.indexOf(this.elements[i].slice(-2))];
            }else{
                emoji_summary += "⬜"
            }
        }
        point_breakdown.push(emoji_summary);
        point_breakdown.push("words: +" + (this.elements.length - 1).toString());
        point_breakdown.push("undos: +" + (this.undo_count).toString());
        let combo = 0;
        if(this.elements.length - 1 === this.target.length){
            combo++;
            point_breakdown.push("minimal: -" + this.target.length.toString());
            score -= this.target.length;
        }
        if(this.target.join("") === this.found.join("")){
            combo++;
            point_breakdown.push("in order: -" + this.target.length.toString());
            score -= this.target.length;
        }
        if(combo === 2){
            point_breakdown.push("Perfection! -1");
            score -= 1;
        }
        point_breakdown.push("score: " + score);
        point_breakdown.push("(the lower the better)")
        for(let i = 0; i < point_breakdown.length; i++){
            let summary_element = document.createElement("h4")
            summary_element.innerText = point_breakdown[i];
            summary_element.classList.add("summary_element");
            success_popup.appendChild(summary_element);
        }
        let share_text = "Linkling " + new Date().toDateString() + ":\n" + point_breakdown.join("\n") + "\nm-darwall.github.io/linkling";
        let share_button = document.createElement("button");
        share_button.innerText = "share";
        share_button.id = "share_button";
        share_button.addEventListener("click", function(){
            navigator.clipboard.writeText(share_text).then(() => share_button.innerText = "copied");
        })
        success_popup.appendChild(share_button);
        let chain_text = document.createElement("h5");
        chain_text.innerHTML = "Your solution:<br>" + this.elements.join(" -> ");
        chain_text.id = "chain_text";
        success_popup.appendChild(chain_text);
        let optimum_text = document.createElement("h5");
        optimum_text.innerHTML = "Computer's solution:<br>" + this.optimum.join(" -> ");
        optimum_text.id = "optimum_text";
        success_popup.appendChild(optimum_text);
        let random_game = document.createElement("button")
        random_game.id = "random_game_button";
        random_game.innerText = "play a random game";
        random_game.addEventListener("click", function(){
            const url = new URL(window.location.href);
            url.searchParams.set("game", Math.floor(Math.random()*100000).toString());
            window.location.href = url.toString();
        })
        success_popup.appendChild(random_game);
    }

    add_chain_element(word, overlap_end, unlocker){
        let new_word = document.createElement("h3");
        new_word.id = "chain_element_" + this.elements.length;
        new_word.classList.add("chain_element")
        for(let i = 0; i < word.length; i++){
            let new_span = document.createElement("span");
            new_span.innerText = word[i];
            new_span.id = "element_" + this.elements.length + "_letter_" + i;
            if(overlap_end > i){
                new_span.classList.add("overlap_start");
            }
            if(unlocker && i === word.length - 2){
                new_span.classList.add("unlocker_left");
            }
            if(unlocker && i === word.length - 1){
                new_span.classList.add("unlocker_right");
            }
            new_word.appendChild(new_span);
        }
        document.getElementById("chain-container").appendChild(new_word);
        new_word.scrollIntoView({behavior: 'smooth', block: 'center'});
        //update overlap on previous element
        if(this.elements.length > 1){
            let previous_word = this.elements[this.elements.length - 2]
            let overlap_index = previous_word.length - overlap_end;
            for(let i=overlap_index; i < previous_word.length; i++){
                let id = "element_" + (this.elements.length - 1) + "_letter_" + i;
                let letter = document.getElementById(id);
                letter.classList.add("overlap_end");
            }
        }

    }

    display_error(text){
        let message = document.createElement("h3");
        message.innerText = text;
        message.classList.add("error");
        document.getElementById("chain-container").appendChild(message);
        message.scrollIntoView({behavior: 'smooth', block: 'center'});
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
        let overlap = checkOverlap(latest, guess)
        if(overlap === false){
            this.display_error("incorrect overlap")
            return false;
        }
        return overlap;
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
                    to_edit[i].style.color = "#cfe0c3ff";
                }
            }
        }
        this.undo_count++;

        let previous_word = this.elements[this.elements.length - 1]
        for(let i=0; i < previous_word.length; i++){
            let id = "element_" + (this.elements.length) + "_letter_" + i;
            let letter = document.getElementById(id);
            letter.classList.remove("overlap_end");
        }
        latest = document.getElementById("chain_element_" + this.elements.length)
        latest.scrollIntoView({behavior: 'smooth', block: 'center'});
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
                    return word[current_available.length - 1] === current_word.slice(-2)
                    // return word.includes(current_word.slice(-2));
                })
                if(current_targets.length === 0){
                    continue;
                }
            }

            if(current_available.length === target_length){
                target = current_targets[0];
                return [start, target, current_path];
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
    let needed = new Set();
    for(let i = 0; i < possible_targets.length; i++){
        needed.add(possible_targets[i][current_available.length]);
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
            return i;
        }
    }
    return false;
}



async function setup(wordlist){
    let words = await getWords(wordlist);
    let even_words = words.filter(function(word){
        return word.length % 2 === 0;
    })
    let seed;
    let game = new URLSearchParams(window.location.search).get("game");
    console.log(new URLSearchParams(window.location.search));
    if(game){
        seed = parseInt(game);
    } else {
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        let yyyy = today.getFullYear();
        seed = parseInt(dd+mm+yyyy)
    }
    let puzzle = generatePuzzle(words, even_words, 5, seed);
    let chain = new Chain(words, ...puzzle);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i];
        section.classList.add("target");
        section.classList.add("section_" + puzzle[1][i])
        document.getElementById("target-container").appendChild(section);
    }

    document.onkeydown = function(e){
        if(e.key.length === 1 && e.key.toLowerCase().match(/[a-z]/i)){
            document.getElementById("input-box").value += e.key.toLowerCase();
        }
        if(e.key === "Backspace"){
            let input = document.getElementById("input-box");
            input.value = input.value.slice(0, -1);
        }
        if(e.key === "Enter"){
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
    document.getElementById("howto_button").onclick = function(){
        document.getElementById("howto").style.display = "flex";
    }
    document.getElementById("close_howto").onclick =function (){
        document.getElementById("howto").style.display = "none";
    }
}

function flash_key(key){
    key.classList.add("pressed_key");
    setTimeout(function (){
        key.classList.remove("pressed_key");
    }, 200)
}

function setup_keyboard(){
    for(let i=0; i<26;i++){
        let current_letter = "qwertyuiopasdfghjklzxcvbnm"[i];
        let key = document.getElementById("letter_"+current_letter);
        key.onclick = function(){
            let input = document.getElementById("input-box");
            input.value = input.value + current_letter;
            flash_key(key)
        };
        document.getElementById("backspace").onclick = function(){
            let input = document.getElementById("input-box");
            input.value = input.value.slice(0, -1);
            flash_key(document.getElementById("backspace"));
        }
    }

}
