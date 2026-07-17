class Chain{
    constructor(words, starter, target){
        this.elements = [starter];
        this.target = [...new Set(target)];
        this.found = [];
        this.words = words;
    }

    addWord(word){
        if (this.checkGuess(word)){
            this.elements.push(word);
            let new_word = document.createElement("h3");
            new_word.innerText = word;
            new_word.id = "chain_element_" + this.elements.length;
            document.getElementById("chain-container").appendChild(new_word);
            if(this.target.includes(word.slice(-2))){
                this.found.push(word.slice(-2));
                let to_edit = document.getElementsByClassName("section_" + word.slice(-2))
                for(let i = 0; i < to_edit.length; i++){
                    to_edit[i].style.color = "green";
                }
                if(this.target.length === [...new Set(this.found)].length){
                    complete();
                }
            }
            return true;
        }
        return false;
    }

    checkGuess(guess){
        if(!this.words.includes(guess)) {
            return false;
        }
        let latest = this.elements[this.elements.length - 1];
        return checkOverlap(latest, guess);
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

function get_possible_targets(even_words, words){
    let split_even_words = [];
    for(let i = 0; i < even_words.length; i++){
        split_even_words.push([]);
        for(let j = 0; j < even_words[i].length; j+=2){
            split_even_words[i].push(even_words[i][j] + even_words[i][j+1]);
        }
    }
    even_words = split_even_words.filter(function(word){return word.length === 3 && [...new Set(word)].length === 3});
    // achievable endings from wordlist
    let end_pairs = [...new Set(words.map((word, element) =>{return word.slice(-2)}))].filter(function(word){return word.length === 2})
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

function generatePuzzle(words, even_words){
    let possible_targets = get_possible_targets(even_words, words);
    let start = ""
    let target = []
    while (target.length === 0){
        start = words[Math.floor(Math.random()*words.length)];
        console.log("Trying with starting word: ", start)
        let frontier = [[start, [start], possible_targets]];
        let explored = new Set();
        let counter = 0;
        while(frontier.length > 0 && counter < 3000){
            counter++;
            let current = frontier.shift();
            let current_word = current[0];
            let current_path = current[1];
            if(current_path.length - 1 > 4){
                console.log("too deep")
                break;
            }
            let current_available = current_path.map(word => word.slice(-2)).slice(1);
            let current_targets = current[2].filter(function(word){
                return word.includes(current_word.slice(-2)) !== false;
            })

            let available_words = []
            if(current_available.length === 3){
                available_words = checkForWord(current_available, current_targets);
            }
            if(available_words.length > 0){
                target = available_words[0]
                console.log(current_path)
                console.log(target)
                return [start, target]
            }
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
        break;
    }
}

function getRequiredPairs(possible_targets, current_available){

    let needed = new Set(possible_targets.flat())
    for(let i = 0; i < current_available.length; i++){
        needed.delete(current_available[i]);
    }
    return needed
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

function complete() {
    alert("You did it!")
}

async function setup(wordlist){
    let words = await getWords(wordlist);
    let even_words = words.filter(function(word){
        return word.length % 2 === 0;
    })
    let puzzle = generatePuzzle(words, even_words);
    let starter_word = document.createElement("h3");
    starter_word.innerText = puzzle[0];
    document.getElementById("chain-container").appendChild(starter_word);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i] + " ";
        section.classList.add("target");
        section.classList.add("section_" + puzzle[1][i])
        document.getElementById("target-container").appendChild(section);
    }
    let chain = new Chain(words, puzzle[0], puzzle[1]);
    document.getElementById("input-box").onkeydown = function(e){
        if(e.code === "Enter"){
            let result = chain.addWord(document.getElementById("input-box").value);
            if(result){
                document.getElementById("input-box").value = "";
            }
        }
    }
    document.getElementById("undo-button").onclick = function(){
        chain.undo()
    }
}

