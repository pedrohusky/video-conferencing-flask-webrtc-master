import os
import ssl
import time
from flask import Flask, jsonify, render_template, request, session
from flask_socketio import SocketIO, emit, join_room
import platform


app = Flask(__name__)
app.config['SECRET_KEY'] = "wubba lubba dub dub"

socketio = SocketIO(app)

users_in_room = {}
rooms_sid = {}
names_sid = {}
room_admins = {}
banned_ips = {}


@app.route("/join", methods=["GET"])
def join():
    print(request.args)
    display_name = request.args.get("display_name")
    mute_audio = request.args.get("mute_audio")  # 1 or 0
    mute_video = request.args.get("mute_video")  # 1 or 0
    room_id = request.args.get("room_id")

    # Check if the display_name is already in use in the room
    if is_username_taken(room_id, display_name):
        error_message = "Username already in use in the room."
        return render_template(
            "index.html",
            room_id=room_id,
            display_name=display_name,
            mute_audio=mute_audio,
            mute_video=mute_video,
            error_message=error_message,
        )

    session[room_id] = {
        "nome": display_name,
        "mute_audio": mute_audio,
        "mute_video": mute_video,
        "admin": (
            "1"
            if len(users_in_room.get(room_id, [])) == 0
            or display_name in room_admins.get(room_id, [])
            else "0"
        ),
        "ip": request.remote_addr
    }

    print(f"IP's banidos: {banned_ips} - IP do novo participante: {request.remote_addr}")

    if request.remote_addr in banned_ips.get(room_id, []):
        error_message = "Você foi banido da sala: " + room_id;
        return render_template(
            "index.html",
            room_id=room_id,
            display_name=display_name,
            mute_audio=mute_audio,
            mute_video=mute_video,
            error_message=error_message,
        )
    return render_template(
        "join.html",
        room_id=room_id,
        display_name=session[room_id]["nome"],
        mute_audio=session[room_id]["mute_audio"],
        mute_video=session[room_id]["mute_video"],
        admin=session[room_id]["admin"],
    )


def is_username_taken(room_id, username):
    # Check if the username is already present in the room
    if room_id in users_in_room:
        for user_id, user_data in names_sid[room_id].items():
            if username == user_data["nome"]:
                return True
    return False


@app.route("/", methods=["GET"])
def home():
    
    return render_template(
        "index.html",
    )


@socketio.on("connect")
def on_connect():
    sid = request.sid
    print("New socket connected ", sid)


@socketio.on("join-room")
def on_join_room(data):
    sid = request.sid
    room_id = data["room_id"]
    display_name = session[room_id]["nome"]
    audio_muted = session[room_id]["mute_audio"]
    video_muted = session[room_id]["mute_video"]
    client_ip = request.environ.get("REMOTE_ADDR")
    client_port = request.environ.get("REMOTE_PORT")

    if names_sid.get(room_id) is None:
        names_sid[room_id] = {}
        banned_ips[room_id] = []

    # register sid to the room
    join_room(room_id)
    rooms_sid[sid] = room_id

    # Check if this is the first user in the room
    if len(users_in_room.get(room_id, [])) == 0 or display_name == room_admins.get(
        room_id, []
    ):
        room_admins[room_id] = display_name  # Set the admin for this room

    names_sid[room_id][sid] = {
        "sid": sid,
        "nome": display_name,
        "posicao": len(users_in_room.get(room_id, [])),
        "admin": "1" if room_admins[room_id] == display_name else "0",
        "audio_muted": audio_muted,
        "video_muted": video_muted,
        "ip": client_ip,
        "porta": client_port,
    }

    # broadcast to others in the room
    print(
        f"\n[Sala {room_id}] Novo usuário na sala: {display_name}<{sid}> - admin: {'Sim' if display_name == room_admins[room_id] else 'Não'} - audio: {'Mutado' if audio_muted == '1' else 'Ativado'}, video: {'Sem vídeo' if video_muted == '1' else 'Ativado'}\n"
    )
    emit(
        "user-connect",
        {
            "sid": sid,
            "nome": display_name,
            "audio_muted": audio_muted,
            "video_muted": video_muted,
            "admin": "1" if room_admins[room_id] == display_name else "0",
            "ip": client_ip,
            "porta": client_port,
        },
        broadcast=True,
        include_self=False,
        room=room_id,
    )

    # add to user list maintained on server
    if room_id not in users_in_room:
        users_in_room[room_id] = [sid]
        emit("user-list", {"my_data": names_sid[room_id][sid]})  # send own id only
    else:
        usrlist = {u_id: names_sid[room_id][u_id] for u_id in users_in_room[room_id]}
        # send list of existing users to the new member
        emit("user-list", {"list": usrlist, "my_data": names_sid[room_id][sid]})
        # add new member to user list maintained on server
        users_in_room[room_id].append(sid)

    print(f"\nUsuários na sala: ", users_in_room, "\n")


@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    room_id = rooms_sid[sid]
    display_name = names_sid[room_id].get(sid, {'nome': 'NULO_ERROR'})["nome"]
    posicao = names_sid[room_id].get(sid, {"posicao": -1})["posicao"]

    # if display_name == 'NULO':
    #     return

    print(f"[Sala {room_id}] Usuário saiu da sala: {display_name}<{sid}>")
    users_in_room[room_id].remove(sid)
    emit("user-disconnect", {"sid": sid},
         broadcast=True, include_self=False, room=room_id)

    # Check if the user was the admin
    if display_name in room_admins.get(room_id, []):
        print("Iniciando troca de ADMIN")
        # Find the next user with the closest-to-zero position
        min_posicao = float("inf")
        next_admin = None
        userSid = None
        for user_sid, user_info in names_sid[room_id].items():
            if (
                user_info["posicao"] < min_posicao
                and user_sid in users_in_room[room_id]
            ):
                print("Nova posição de ADMIN detectado.. atualizando..")
                min_posicao = user_info["posicao"]
                next_admin = user_info["nome"]
                userSid = user_sid

        print("Loop completo. Verificando novo ADMIN...")
        # Update the room admin
        if next_admin:
            print("Admin verificado com sucesso. Atualizando..")
            room_admins[room_id] = next_admin
            names_sid[room_id][userSid]["admin"] = '1'
            emit(
                "update-admin",
                {"admin": "1", "sid": userSid},
                broadcast=True,
                include_self=False,
                room=room_id,
            )
            print(f"[Sala {room_id}] Novo administrador: {next_admin}")

    if len(users_in_room[room_id]) == 0:
        users_in_room.pop(room_id)

    rooms_sid.pop(sid)
    names_sid[room_id].pop(sid)

    print(f"\nUsuários restantes na sala: {users_in_room}\n")


# @socketio.on("kicked")
# def kicked():
#     sid = request.sid
#     room_id = rooms_sid[sid]
#     display_name = names_sid[room_id][sid]["nome"]
#     posicao = names_sid[room_id][sid]["posicao"]

#     print(f"[Sala {room_id}] Usuário saiu da sala: {display_name}<{sid}>")
#     users_in_room[room_id].remove(sid)
#     emit(
#         "user-disconnect",
#         {"sid": sid},
#         broadcast=True,
#         include_self=False,
#         room=room_id,
#     )

#     names_sid[room_id].pop(sid)

#     print(f"\nUsuários restantes na sala: {users_in_room}\n")


@socketio.on("data")
def on_data(data):
    sender_sid = data['sender_id']
    target_sid = data['target_id']
    if sender_sid != request.sid:
        print("[Not supposed to happen!] request.sid and sender_id don't match!!!")

    if data["type"] != "new-ice-candidate":
        print(f"Mensagem tipo '{data['type']}' de {sender_sid} para {target_sid}")
        
    socketio.emit('data', data, room=target_sid)


@socketio.on("change")
def handle_data(change):
    socketio.emit("change", change, room=change['room_id'])


@socketio.on("chat-message")
def chat_message_new(message):
    sid = request.sid
    room_id = message["room_id"]
    name = names_sid[room_id].get(sid, {'nome': 'NULO'})["nome"]
    message = message['message']
    print(f"[Sala {room_id}] Usuário {name} disse: {message}")
    emit("chat-message", {"name": name, "message": message}, room=room_id)


@socketio.on("mute-user")
def mute_user(data):
    print('MuteUser: ', data)
    sid = data['user_id']
    sender_id = data["sender_id"]
    room_id = data["room_id"]
    type = data["type"]

    if type == "KICK":
        emit(
            "kick-user",
            {"sid": sid, "sender_id": sender_id, "type": type},
            broadcast=True,
            include_self=False,
            room=room_id,
        )
        print(f"\nUsuários restantes na sala: {users_in_room}\n")

    elif type == "BAN":
        emit(
            "kick-user",
            {"sid": sid, "sender_id": sender_id, "type": type},
            broadcast=True,
            include_self=False,
            room=room_id,
        )
        ip = names_sid[room_id][sid]["ip"]
        nome = names_sid[room_id][sid]["nome"]

        print(f"\nUsuários restantes na sala: {users_in_room}\n")

        print("Iniciando banimento do usuário...")

        if ip not in banned_ips[room_id]:
            banned_ips[room_id].append(ip)
            print(f"PARTICIPANTE: {nome} <{sid}> - ({ip}) - BANIDO")
    else:
        emit(
            "mute-user",
            {
                "sid": sid,
                "sender_id": sender_id,
                "type": data["type"],
                "muted": data["muted"],
            },
            broadcast=True,
            include_self=False,
            room=room_id,
        )


# Define the SSL context
# ssl_context = ssl.create_default_context(purpose=ssl.Purpose.CLIENT_AUTH)
# ssl_context.load_cert_chain(certfile="cert.pem", keyfile="key.pem")

socketio.run(
    app,
    host="0.0.0.0",
    debug=True,
    allow_unsafe_werkzeug=True,
    # ssl_context=ssl_context
)
