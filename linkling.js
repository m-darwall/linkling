
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

async function setup(wordlist){
    let words = await getWords(wordlist);
    let puzzle = generatePuzzle(words);
    let starter_word = document.createElement("h3");
    starter_word.innerText = puzzle[0];
    document.getElementById("chain-container").appendChild(starter_word);
    for(let i = 0; i < puzzle[1].length; i++){
        let section = document.createElement("h3");
        section.innerText = puzzle[1][i];
        document.getElementById("target-container").appendChild(section);
    }

}