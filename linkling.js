let words = [];

function getWords(wordlist){
    fetch(wordlist)
        .then(response => response.text())
        .then((data) => {
            words = data.split("\r\n").slice(26, -1)
            for (let i = 0; i < words.length; i++) {
                words[i] = words[i].replace("$", "");
            }
        })
}