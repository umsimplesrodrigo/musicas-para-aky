const firebaseConfig = {
    apiKey: "AIzaSyDyS4gKgKHgOT_HwFXZELVFSKcQsM4qmfk",
    authDomain: "site-musicas-aky.firebaseapp.com",
    databaseURL: "https://site-musicas-aky-default-rtdb.firebaseio.com",
    projectId: "site-musicas-aky",
    storageBucket: "site-musicas-aky.firebasestorage.app",
    messagingSenderId: "803129465374",
    appId: "1:803129465374:web:66d14c38a4cb3d3c1cac0f",
    measurementId: "G-8QDN48KX29"
};
  
firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("anotacoes");
  
let nick = localStorage.getItem("nickname");

window.addEventListener("DOMContentLoaded", () => {
  if (nick) {
    document.getElementById("nickname").value = nick;
    document.getElementById("nickname").disabled = true;
  }
});

function enviarAnotacao() {
    if (!nick) {
      const inputNick = document.getElementById("nickname").value.trim();
      if (!inputNick) return alert("Informe seu nick.");
      localStorage.setItem("nickname", inputNick);
      document.getElementById("nickname").disabled = true;
      nick = inputNick;
    }
  
    const texto = document.getElementById("mensagem").value.trim();
    if (!nick || !texto) return alert("Preencha os dois campos.");
  

    const agora = Date.now();
    const limite = 5;
    const intervalo = 30 * 60 * 1000;
  
    db.orderByChild("nick").equalTo(nick).once("value", snapshot => {
      let contador = 0;
      snapshot.forEach(item => {
        const anot = item.val();
        if (agora - anot.timestamp <= intervalo) {
          contador++;
        }
      });
  
      if (contador >= limite) {
        alert("Você já enviou 5 anotações nos últimos 30 minutos. Tente novamente mais tarde.");
        return;
      }
  
      const novaAnotacao = {
        nick,
        texto,
        timestamp: agora,
        ups: {}
      };
  
      db.push(novaAnotacao);
      document.getElementById("mensagem").value = "";
    });
}
  
  
function darUp(id, usuario) {
    const upRef = db.child(id).child("ups/").child(usuario);
    upRef.once("value", snap => {
      if (!snap.exists()) {
        upRef.set(true);
      }
    });
}
  
function renderizar() {
    db.on("value", snap => {
        const lista = document.getElementById("lista-anotacoes");
        lista.innerHTML = "";

        const usuarioAtual = document.getElementById("nickname").value.trim();

        const anotacoes = [];
        snap.forEach(item => {
            const dados = item.val();
            const id = item.key;

            if (Date.now() - dados.timestamp <= 5 * 60 * 1000) {
                anotacoes.push({ id, ...dados });
            } else {
                db.child(id).remove();
            }
        });

        anotacoes.sort((a, b) => Object.keys(b.ups || {}).length - Object.keys(a.ups || {}).length);

        for (const nota of anotacoes) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${nota.nick}</strong>: ${nota.texto}<br>
                <button onclick="darUp('${nota.id}', '${usuarioAtual}')">Up (${Object.keys(nota.ups || {}).length})</button>`;
            lista.appendChild(li);
        }
    });
}

  
  renderizar();
  