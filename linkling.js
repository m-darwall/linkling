// last time words.txt was updated and therefore continuity was broken
let last_word_update = "26072026";
class Chain{
    constructor(words, words_check, starter, target, found_path, seed){
        this.elements = [starter];
        this.add_chain_element(starter, 0, false)
        this.target = target;
        this.found = [];
        this.words = words;
        this.words_check = words_check;
        this.undo_count = 0;
        this.optimum = found_path;
        this.seed = seed;
        this.history = []
        this.finished = false;
        this.checkCorruption()
    }

    storeLocally() {
        localStorage.setItem(this.seed, JSON.stringify(this.history));
    }

    checkCorruption(){
        let started = localStorage.getItem("started");
        if(started){
            if(compareDates(started, last_word_update)){
                localStorage.clear()
                localStorage.setItem("started", format_date(0));
            }
        }else{
            localStorage.clear();
            localStorage.setItem("started", format_date(0))
        }
    }

    salvageState(){
        let history = localStorage.getItem(this.seed);
        if(history){
            history = JSON.parse(history);
            for(let i=0; i<history.length;i++){
                if(history[i] === -1){
                    this.undo()
                }else{
                    this.addWord(history[i]);
                }
            }
            this.history = history;
        }
    }

    updateCompleted(){
        let completed = localStorage.getItem("completed");
        if(completed){
            completed = JSON.parse(completed);
            completed.push(this.seed)
        }else{
            completed = [this.seed]
        }
        localStorage.setItem("completed", JSON.stringify(completed));
    }

    checkStreak(){
        let completed = localStorage.getItem("completed");
        if(completed === false){
            return false;
        }
        completed = JSON.parse(completed);
        let streak = 0;
        while(1===1){
            let date = format_date(-streak);
            if(completed.includes(date)){
                streak++;
            } else{
                break;
            }
        }
        return streak;
    }

    getEndings(){
        return this.elements.map(function(e){return e.slice(-2)})
    }

    addWord(word){
        word = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
        let check = this.checkGuess(word);
        if (check !== false){
            this.elements.push(word);
            this.history.push(word);
            this.storeLocally()
            if(this.target.includes(word.slice(-2))){
                if(this.found.includes(word.slice(-2)) === false){
                    this.found.push(word.slice(-2));
                    this.add_chain_element(word, check, true);
                }else{
                    this.add_chain_element(word, check, false);
                }
                let to_edit = document.getElementsByClassName("section_" + word.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].classList.add("unlocked");
                }
                if(this.target.length === this.found.length){
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
        this.finished = true;
        this.updateCompleted()
        // hide unnecessary buttons
        hide("keyboard-container");
        hide("undo-button");
        hide("submit-button");
        hide("input-box");
        // show success popup
        let success_popup = document.getElementById('success');
        success_popup.style.display = 'flex';
        // close button for summary
        let close_success = document.getElementById("close_success");
        close_success.onclick = function(){
            hide("success");
            let show_success = document.getElementById("show_success");
            show_success.onclick = function(){document.getElementById("success").style.display = 'flex'}
            show_success.style.display = 'flex';
        }
        let score = 0;
        let max_score = 20*this.target.length;
        let point_breakdown = []
        let emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        let emoji_summary = ""
        let found = []
        for(let i = 1; i < this.elements.length; i++){
            if(this.target.includes(this.elements[i].slice(-2))){
                if(false === found.includes(this.elements[i].slice(-2))){
                    found.push(this.elements[i].slice(-2));
                    emoji_summary += emoji[this.target.indexOf(this.elements[i].slice(-2))];
                    continue;
                }
            }
            emoji_summary += "⬜"
        }
        point_breakdown.push(emoji_summary);
        point_breakdown.push("unlocked: +10 x " + this.target.length);
        score += this.target.length*10;
        let excess = this.elements.length - 1 - this.target.length;
        if(excess !== 0){
            point_breakdown.push("excess words: -10 x " + excess.toString());
            score -= 10*excess;
        }
        let undos = this.undo_count;
        if(undos !== 0){
            point_breakdown.push("undos: -10 x " + undos.toString());
            score -= 10*undos
        }
        if(this.elements.length - 1 === this.target.length){
            point_breakdown.push("minimal: +" + 5*this.target.length.toString());
            score += this.target.length*5;
        }
        if(this.target.join("") === this.found.join("")){
            point_breakdown.push("in order: +" + 5*this.target.length.toString());
            score += this.target.length*5;
        }
        point_breakdown.push("score: " + score + "/" + max_score);
        if(score === max_score){
            point_breakdown.push("perfect!")
        }
        let share_text = "Linkling";
        if(this.seed === format_date(0)){
            let streak = this.checkStreak();
            point_breakdown.push("streak: " + streak);
            share_text += " " + new Date().toDateString();
        }
        for(let i = 0; i < point_breakdown.length; i++){
            let summary_element = document.createElement("h4")
            summary_element.innerText = point_breakdown[i];
            summary_element.classList.add("summary_element");
            success_popup.appendChild(summary_element);
        }
        share_text += ":\n" + point_breakdown.join("\n") + "\n" + window.location.href;
        let share_button = document.createElement("button");
        share_button.innerText = "share";
        share_button.id = "share_button";
        share_button.addEventListener("click", async function(){
            if(navigator.share){
                await navigator.share({
                    title: "Linkling",
                    text: share_text})
            }else{
                navigator.clipboard.writeText(share_text).then(() => share_button.innerText = "copied");
            }
        })
        success_popup.appendChild(share_button);


        let chain_text = document.createElement("h5");
        let searching_for = 0;
        let found_at = []
        for(let i = 0; i < this.elements.length; i++){
            if(this.elements[i].slice(-2) === this.found[searching_for]){
                found_at.push(i);
                searching_for++;
            }
        }
        let chain_string = this.elements.map(function(item, i){
            if(found_at.includes(i)){
                return item.slice(0, -2) + "<span class='unlocker_left'>" + item[item.length - 2] + "</span><span class='unlocker_right'>" + item[item.length - 1] + "</span>";
            }
            return item;
        })
        chain_text.innerHTML = "Your solution:<br>" + chain_string.join(" → ");
        chain_text.id = "chain_text";
        success_popup.appendChild(chain_text);

        let optimum_text = document.createElement("h5");
        let optimum_string = this.optimum.map(function (item, index){
            if(index === 0){
                return item;
            }
            return item.slice(0, -2) + "<span class='unlocker_left'>" + item[item.length - 2] + "</span><span class='unlocker_right'>" + item[item.length - 1] + "</span>";
        })
        optimum_text.innerHTML = "Computer's solution:<br>" + optimum_string.join(" → ");
        optimum_text.id = "optimum_text";
        success_popup.appendChild(optimum_text);


        let navigator_box = document.createElement("div");
        navigator_box.id = "navigator_box";
        success_popup.appendChild(navigator_box);
        if(this.checkStreak() === 0){
            let today_game = document.createElement("button");
            today_game.id = "today_game_finished";
            today_game.innerText = "today's game";
            today_game.classList.add("game_end_navigator");
            today_game.addEventListener("click", redirectToToday)
            navigator_box.appendChild(today_game);
        }
        let random_game = document.createElement("button")
        random_game.id = "random_game_button";
        random_game.innerText = "play a random game";
        random_game.classList.add("game_end_navigator");
        random_game.addEventListener("click", function(){
            const url = new URL(window.location.href);
            url.searchParams.set("game", Math.floor(Math.random()*100000).toString());
            window.location.href = url.toString();
        })
        navigator_box.appendChild(random_game);
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
        if(!this.words_check.includes(guess)) {
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
        this.history.push(-1)
        this.storeLocally()
        document.getElementById("chain_element_" + this.elements.length).remove();
        let latest = this.elements.pop()

        if(this.target.includes(latest.slice(-2))){
            let endings = this.getEndings()
            let counter = 0;
            let ending;
            for(ending of endings){
                if(ending === latest.slice(-2)){
                    counter++;
                }
            }
            if(counter === 0){
                this.found.pop()
                let to_edit = document.getElementsByClassName("section_" + latest.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].classList.remove("unlocked")
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
    words = words.split(/[\r\n]+/).slice(26, -1);
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

// returns true if date1 is before date2. date strings in ddmmyyyy format
function compareDates(date1, date2) {
    const d1 = {
        day: Number(date1.slice(0, 2)),
        month: Number(date1.slice(2, 4)) - 1,
        year: Number(date1.slice(4))
    };

    const d2 = {
        day: Number(date2.slice(0, 2)),
        month: Number(date2.slice(2, 4)) - 1,
        year: Number(date2.slice(4))
    };

    const dateObj1 = new Date(d1.year, d1.month, d1.day);
    const dateObj2 = new Date(d2.year, d2.month, d2.day);

    return dateObj1.getTime() < dateObj2.getTime();
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

function redirectToToday(){
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search)
    params.delete("game");
    url.search = params.toString();
    window.location.href = url.toString();
}

// returns ddmmyyyy for (today + offset days)
function format_date(offset){
    let today = new Date();
    today.setDate(today.getDate() + offset);
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    return dd+mm+yyyy
}

async function setup(wordlist, wordlist2){
    let words = await getWords(wordlist);
    let words2 = await getWords(wordlist2);
    let even_words = words.filter(function(word){
        return word.length % 2 === 0;
    })
    let seed;
    let game = new URLSearchParams(window.location.search).get("game");
    let goto_today = document.getElementById("goto_today")
    goto_today.addEventListener("click", redirectToToday);
    if(game){
        seed = game;
        if(isNaN(parseInt(seed))){
            redirectToToday();
        }
        goto_today.style.display = "flex";
    } else {
        seed = format_date(0)
    }
    let puzzle = generatePuzzle(words, even_words, 5, parseInt(seed));
    document.getElementById("loading").style.display = "none"; // remove loading indicator when puzzle has generated
    let chain = new Chain(words, words2, ...puzzle, seed);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i];
        section.classList.add("target");
        section.classList.add("section_" + puzzle[1][i])
        document.getElementById("target-container").appendChild(section);
    }
    chain.salvageState()
    let handler = captureKeyboardHandler(chain);
    document.addEventListener("keydown", handler)
    document.getElementById("submit-button").onclick = function(){
        if(chain.finished){
            return cancelInputs();
        }
        chain.addWord(document.getElementById("input-box").value);
        document.getElementById("input-box").value = "";
    }
    document.getElementById("undo-button").onclick = function(){
        if(chain.finished){
            return cancelInputs();
        }
        chain.undo()
        document.getElementById("undo-button").blur();
    }
    document.getElementById("howto_button").onclick = function(){
        document.getElementById("howto").style.display = "flex";
    }
    document.getElementById("close_howto").onclick =function (){
        document.getElementById("howto").style.display = "none";
    }
}
function captureKeyboardHandler(chain){
    return function captureKeyboard(e){
        if(chain.finished){
            return cancelInputs();
        }
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
}


function cancelInputs(){
    document.removeEventListener("keydown", captureKeyboardHandler);
    document.getElementById("submit-button").onclick = function(){return false};
    document.getElementById("undo-button").onclick = function(){return false};
    return true;
}

function hide(id){
    document.getElementById(id).style.display = "none";
}

function flash_key(key){
    key.classList.add("pressed_key");
    setTimeout(function (){
        key.classList.remove("pressed_key");
    }, 200)
}

// takes a list of strings where each string is a row of the keyboard
function setup_keyboard(keys){
    let container = document.getElementById("keyboard-container")
    for(let row = 0; row < keys.length; row++){
        let this_row = document.createElement("div")
        this_row.classList.add("keyboard_row");
        this_row.id = "keyboard_row_" + row.toString()
        container.appendChild(this_row);
        for(let key = 0; key < keys[row].length; key++){
            let this_key = document.createElement("div")
            this_key.classList.add("keyboard_key");
            this_key.id = "letter_" + keys[row][key];
            this_key.innerText = keys[row][key];
            this_key.onclick = function(){
                let input = document.getElementById("input-box");
                input.value = input.value + keys[row][key];
                flash_key(this_key)
            };
            this_row.appendChild(this_key);
        }
        if(row === keys.length - 1){
            let backspace = document.createElement("div")
            backspace.classList.add("keyboard_key");
            backspace.innerText = "⌫"
            backspace.id = "backspace"
            backspace.onclick = function(){
                let input = document.getElementById("input-box");
                input.value = input.value.slice(0, -1);
                flash_key(backspace);
            }
            this_row.appendChild(backspace)
        }
    }
}
