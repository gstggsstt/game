var current = false;
var role = false;
var ready = false;
var turn = 2;
var N = 0;
var xx = 0;
var yy = 0;
var posA = {},
	posB = {};
var vblock = [],
	hblock = [];
var hispos = [];
var hEdge = [],
	vEdge = []
var goodBox = [];
var cnt = 0;
var socket=io();
var remote_op = false;

function Fix(x, N) {
	if (x < 0) return 0;
	if (x >= N) return N - 1;
	return x;
}

function SetBoxColor(i, j, color) {
	i = Fix(i, N), j = Fix(j, N);
	var box = document.getElementById("box_" + i + "_" + j);
	box.style.backgroundColor = color;
}

function SetHedgeColor(pos, color) {
	var i = Fix(pos.x, N - 1),
		j = Fix(pos.y, N)
	if (hblock[i][j] && color != "red") return;
	var box = document.getElementById("hedge_" + i + "_" + j);
	box.style.backgroundColor = color;
	hEdge.push({ x: pos.x, y: pos.y });
}

function SetVedgeColor(pos, color) {
	var i = Fix(pos.x, N),
		j = Fix(pos.y, N - 1);
	if (vblock[i][j] && color != "red") return;
	var box = document.getElementById("vedge_" + i + "_" + j);
	box.style.backgroundColor = color;
	vEdge.push({ x: pos.x, y: pos.y });
}

function NotAB(pos) {
	if (pos.x == posA.x && pos.y == posA.y) return false;
	if (pos.x == posB.x && pos.y == posB.y) return false;
	return true;
}

function ShowNext(pos, color = "#C3F5A9") {
	goodBox = [];
	if (pos.x - 1 >= 0 && !hblock[pos.x - 1][pos.y] && NotAB({ x: pos.x - 1, y: pos.y })) {
		SetBoxColor(pos.x - 1, pos.y, color);
		goodBox.push({ x: pos.x - 1, y: pos.y });
	}
	if (pos.x + 1 < N && !hblock[pos.x][pos.y] && NotAB({ x: pos.x + 1, y: pos.y })) {
		SetBoxColor(pos.x + 1, pos.y, color);
		goodBox.push({ x: pos.x + 1, y: pos.y });
	}
	if (pos.y - 1 >= 0 && !vblock[pos.x][pos.y - 1] && NotAB({ x: pos.x, y: pos.y - 1 })) {
		SetBoxColor(pos.x, pos.y - 1, color);
		goodBox.push({ x: pos.x, y: pos.y - 1 });
	}
	if (pos.y + 1 < N && !vblock[pos.x][pos.y] && NotAB({ x: pos.x, y: pos.y + 1 })) {
		SetBoxColor(pos.x, pos.y + 1, color);
		goodBox.push({ x: pos.x, y: pos.y + 1 });
	}
}

function ShowEdge(color) {
	hEdge = [];
	vEdge = [];
	for (var box of hispos) {
		SetHedgeColor(box, color);
		SetVedgeColor(box, color);
		box.x--;
		SetHedgeColor(box, color);
		box.x++;
		box.y--;
		SetVedgeColor(box, color);
		box.y++;
	}
}

function MoveTo(pos, i, j, str) {
	var box = document.getElementById("box_" + pos.x + "_" + pos.y);
	box.textContent = "";
	box.style.backgroundColor = "";
	ShowNext(pos, "");
	box = document.getElementById("box_" + i + "_" + j);
	box.textContent = str;
	if (turn == 1) box.style.backgroundColor = "#FEF033";
	if (turn == 0) box.style.backgroundColor = "#C8EBF6";
	pos.x = i, pos.y = j;
}

function ClickBox(i, j) {
	if(!ready) return ;
	if(remote_op==false && role!=current) return ;
	var str = "O", pos = posB;
	if (current) str = "X", pos = posA;
	if (turn < 1)
	{
		if(pos.x!=i || pos.y!=j) return ;
		ShowEdge("");
		Switch();
		if(remote_op==false)
			socket.emit("click","box_"+i+"_"+j);
		else remote_op=false;
		return;
	}
	if (!find(goodBox, { x: i, y: j })) return;
	turn--;
	MoveTo(pos, i, j, str);
	hispos.push({ x: i, y: j });
	if (turn >= 1) ShowNext(pos);
	else ShowEdge("#8EC6FE");
	if(remote_op==false)
		socket.emit("click","box_"+i+"_"+j);
	else remote_op=false;
}

function find(l, x) {
	for (var e of l) {
		var fl = 1;
		for (var k in x)
			if (e[k] != x[k]) { fl = 0; break; }
		if (fl) return true;
	}
	return false;
}

function CheckState(pos, tar, visited, color) {
	if (pos.x == tar.x && pos.y == tar.y)
		return true;
	if (visited[pos.x][pos.y]) return false;
	visited[pos.x][pos.y] = color;
	cnt++;

	if (pos.x - 1 >= 0 && !hblock[pos.x - 1][pos.y] &&
		CheckState({ x: pos.x - 1, y: pos.y }, tar, visited, color)) return true;
	if (pos.y - 1 >= 0 && !vblock[pos.x][pos.y - 1] &&
		CheckState({ x: pos.x, y: pos.y - 1 }, tar, visited, color)) return true;
	if (pos.x + 1 < N && !hblock[pos.x][pos.y] &&
		CheckState({ x: pos.x + 1, y: pos.y }, tar, visited, color)) return true;
	if (pos.y + 1 < N && !vblock[pos.x][pos.y] &&
		CheckState({ x: pos.x, y: pos.y + 1 }, tar, visited, color)) return true;

	return false;
}

function RePaint(visited)
{
	for(var i=0;i<N;++i)
		for(var j=0;j<N;++j)
		{
			if(visited[i][j]==1) SetBoxColor(i,j,"#C1EFC6");
			else if(visited[i][j]==2) SetBoxColor(i,j,"#BCE9FB");
			else SetBoxColor(i,j,"#F6C3C3");
		}

	$('#status').text("Game Over! Refresh page to play again.");
}

function Switch() {
	hispos = [];
	vedge = [];
	hedge = [];
	current = !current;
	turn = 2;
	if (current) {
		ShowNext(posA);
		SetBoxColor(posA.x, posA.y, "orange");
		SetBoxColor(posB.x, posB.y, "");
		hispos.push({ x: posA.x, y: posA.y });
	} else {
		ShowNext(posB);
		SetBoxColor(posA.x, posA.y, "");
		SetBoxColor(posB.x, posB.y, "orange");
		hispos.push({ x: posB.x, y: posB.y });
	}
	var visited = []
	for (var i = 0; i < N; ++i) visited.push(new Array());
	cnt = 0;
	if (!CheckState({ x: posA.x, y: posA.y }, { x: posB.x, y: posB.y }, visited, 1)) {
		var X = cnt;
		cnt = 0;
		CheckState({ x: posB.x, y: posB.y }, { x: posA.x, y: posA.y }, visited, 2);
		RePaint(visited);
		var O = cnt;
		cnt = 0;
		var str = "X: " + X + "; O: " + O + "\n";
		if (X > O) str += "X Win!!";
		else if (X < O) str += "O Win!!";
		else str += "Draw!!";
		var p=document.getElementById("result");
		p.hidden=false;
		p.innerText=str;
	}
	if(role==current) $("#status2").text("Your turn");
	else $("#status2").text("Waiting");
}

function ClickVedge(i, j) {
	if(remote_op==false && role!=current) return ;
	if (turn != 0) return;
	if (!find(vEdge, { x: i, y: j })) return;
	vblock[i][j] = true;
	ShowEdge("");
	SetVedgeColor({ x: i, y: j }, "red");
	Switch();
	if(remote_op==false)
		socket.emit("click","vedge_"+i+"_"+j);
	else remote_op=false;
}

function ClickHedge(i, j) {
	if(remote_op==false && role!=current) return ;
	if (turn != 0) return;
	if (!find(hEdge, { x: i, y: j })) return;
	hblock[i][j] = true;
	ShowEdge("");
	SetHedgeColor({ x: i, y: j }, "red");
	Switch();
	if(remote_op==false)
		socket.emit("click","hedge_"+i+"_"+j);
	else remote_op=false;
}

function fff() {
	var table = document.getElementById("board");
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);
	for (var i = 0; i < N; ++i) {
		var tr = document.createElement("tr");
		for (var j = 0; j < N; ++j) {
			var td = document.createElement("td");
			var str = " "

			if (i == posA.x && j == posA.y) str = "X";
			else if (i == posB.x && j == posB.y) str = "O";

			td.setAttribute("id", "box_" + i + "_" + j)
			td.setAttribute("onclick", "ClickBox(" + i + "," + j + ")")
			td.appendChild(document.createTextNode(str));
			tr.appendChild(td);

			if (j != N - 1) {
				td = document.createElement("td");
				td.setAttribute("id", "vedge_" + i + "_" + j);
				td.setAttribute("onclick", "ClickVedge(" + i + "," + j + ")")
				td.setAttribute("class", "vedge");
				tr.appendChild(td);
			}
		}
		tbody.appendChild(tr);
		if (i != N - 1) {
			tr = document.createElement("tr");
			for (var j = 0; j < N; ++j) {
				var td = document.createElement("td");
				td.setAttribute("id", "hedge_" + i + "_" + j);
				td.setAttribute("onclick", "ClickHedge(" + i + "," + j + ")")
				td.setAttribute("class", "hedge");
				tr.appendChild(td);

				if (j != N - 1) {
					td = document.createElement('td');
					td.setAttribute("class", "joint");
					tr.appendChild(td);
				}
			}
			tbody.appendChild(tr);
		}
	}
	Switch();
};

function Init(e) {
	var textbox = document.getElementById("textbox");
	var password = document.getElementById("password").value;
	N = parseInt(textbox.value);
	socket.emit("join",password,N);
	xx = Math.floor((N - 1) / 2);
	yy = Math.floor((N + 1) / 2);
	posA = { x: xx, y: xx };
	posB = { x: yy, y: yy };
	for (var i = 0; i < N; ++i) vblock.push(new Array());
	for (var i = 0; i < N; ++i) hblock.push(new Array());
	var div = document.getElementById("once");
	div.hidden = true;
	var table = document.getElementById("board");
	table.hidden=false;
	var h3 = document.getElementById("status");
	h3.hidden=false;
	h3 = document.getElementById("status2");
	h3.hidden=false;
	fff();
}

$(function() {
	socket.on('x', function(){
		role=true;
		if(role==current) $("#status2").text("Your turn");
		else $("#status2").text("Waiting");
	});
	socket.on('o', function(){
		role=false;
		if(role==current) $("#status2").text("Your turn");
		else $("#status2").text("Waiting");
	});
	socket.on('size error', function(){
		alert("Board size not match!");
		window.location.reload();
	});
	socket.on('ready', function(){
		ready=true;
		$('#status').text('Started!');
		$('#status').css('color','red');
	});
	socket.on('used', function(){
		alert('Password has been used.');
		window.location.reload();
	});
	socket.on('escape', function(){
		alert('Another user escaped.');
		window.location.reload();
	});
	socket.on('click', function(id){
		remote_op=true;
		document.getElementById(id).click();
	});
});

