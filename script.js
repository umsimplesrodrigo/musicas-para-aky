// Configuração do Firebase
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

let nick = localStorage.getItem("nickname") || "";

window.addEventListener("DOMContentLoaded", () => {
  const inputNick = document.getElementById("nickname");
  if (nick) {
    inputNick.value = nick;
    inputNick.disabled = true;
  }
});

function enviarAnotacao() {
  if (!nick) {
    const inputNickValue = document.getElementById("nickname").value.trim();
    if (!inputNickValue) return alert("Informe seu nick.");
    nick = inputNickValue;
    localStorage.setItem("nickname", nick);
    const nickInput = document.getElementById("nickname");
    nickInput.value = nick;
    nickInput.disabled = true;
  }

  const texto = document.getElementById("mensagem").value.trim();
  if (!texto) return alert("Preencha sua anotação.");

  const agora = Date.now();
  const limite = 5;
  const intervalo = 30 * 60 * 1000; // 30 minutos

  db.orderByChild("nick").equalTo(nick).once("value", snapshot => {
    let contador = 0;
    snapshot.forEach(item => {
      const anot = item.val();
      if (agora - anot.timestamp <= intervalo) contador++;
    });

    if (contador >= limite) {
      return alert("Você já enviou 5 anotações nos últimos 30 minutos.");
    }

    const novaAnotacao = { nick, texto, timestamp: agora, ups: {} };
    db.push(novaAnotacao);
    document.getElementById("mensagem").value = "";
  });
}

function darUp(id) {
  // Solicita nick se não houver
  if (!nick) {
    const inputNick = prompt("Informe seu nick para dar up:");
    if (!inputNick) return;
    nick = inputNick.trim();
    localStorage.setItem("nickname", nick);
    const nickInput = document.getElementById("nickname");
    nickInput.value = nick;
    nickInput.disabled = true;
  }

  const upRef = db.child(id).child("ups").child(nick);
  upRef.once("value", snap => {
    if (!snap.exists()) upRef.set(true);
  });
}

function renderizar() {
  db.on("value", snap => {
    const lista = document.getElementById("lista-anotacoes");
    lista.innerHTML = "";
    const anotacoes = [];

    snap.forEach(item => {
      const dados = item.val();
      const id = item.key;
      if (Date.now() - dados.timestamp <= 60 * 60 * 1000) {
        anotacoes.push({ id, ...dados });
      } else {
        db.child(id).remove();
      }
    });

    anotacoes.sort((a, b) => Object.keys(b.ups || {}).length - Object.keys(a.ups || {}).length);

    anotacoes.forEach(nota => {
      const upCount = nota.ups ? Object.keys(nota.ups).length : 0;
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${nota.nick}</strong>: ${nota.texto}<br>
        <button onclick="darUp('${nota.id}')">Up (${upCount})</button>
      `;
      lista.appendChild(li);
    });
  });
}

renderizar();