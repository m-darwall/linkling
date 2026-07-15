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
                console.log("turning green");
                document.getElementById("section_" + word.slice(-2)).style.color = "green";
                if(this.target.length === [...new Set(this.found)].length){
                    complete();
                }
            }
            console.log(this.found);
            return true;
        }
        return false;
    }

    checkGuess(guess){
        if(!this.words.includes(guess)) {
            return false;
        }
        let latest = this.elements[this.elements.length - 1];
        for(let i = 2; i <= latest.length; i++){
            if(latest.slice(-i) === guess.slice(0, i)){
                return true;
            }
        }
        return false;
    }

    undo(){
        if(this.elements.length <= 1){
            return false;
        }
        document.getElementById("chain_element_" + this.elements.length).remove();
        let latest = this.elements.pop()

        if(this.target.includes(latest.slice(-2))){
            console.log("thats one gone")
            this.found.pop()
            console.log(this.found)
            if(this.found.includes(latest.slice(-2)) === false){
                console.log("and it was the only one")
                console.log("turning blue");
                document.getElementById("section_" + latest.slice(-2)).style.color = "aquamarine";
            }
        }
        console.log(this.found);
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

function generatePuzzle(words){
    let start = words[Math.floor(Math.random()*words.length)];
    let target_word = words[Math.floor(Math.random()*words.length)];
    while(target_word.length % 2 !== 0){
        target_word = words[Math.floor(Math.random()*words.length)];
    }
    let target = []
    for(let i = 0; i < target_word.length; i+=2) {
        target.push(target_word[i] + target_word[i + 1])
    }
    return [start, target];
}

function complete() {
    alert("You did it!")
}

async function setup(wordlist){
    let words = await getWords(wordlist);
    let puzzle = generatePuzzle(words);
    let starter_word = document.createElement("h3");
    starter_word.innerText = puzzle[0];
    document.getElementById("chain-container").appendChild(starter_word);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i] + " ";
        section.classList.add("target");
        section.id = "section_" + puzzle[1][i];
        document.getElementById("target-container").appendChild(section);
    }
    let chain = new Chain(words, puzzle[0], puzzle[1]);
    document.getElementById("input-box").onkeydown = function(e){
        if(e.code === "Enter"){
            console.log(document.getElementById("input-box").value);
            let result = chain.addWord(document.getElementById("input-box").value);
            if(result){
                document.getElementById("input-box").value = "";
            }
        }
    }
    document.getElementById("undo-button").onclick = function(e){
        chain.undo()
    }
}

