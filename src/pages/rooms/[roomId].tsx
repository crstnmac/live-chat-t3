import { Session } from "next-auth"
import { signIn, useSession } from "next-auth/react"
import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"
import { Message } from "../../constants/schemas"
import { trpc } from "../../utils/trpc"

function MessageItem({
  message,
  session,
}: {
  message: Message
  session: Session
}) {
  const baseStyles =
    "mb-4 text-md w-7/12 p-4 text-white bg-gray-900 shadow-md shadow-blue-300 rounded-3xl"

  const liStyles =
    message.sender.name === session.user?.name
      ? baseStyles
      : baseStyles.concat(" self-end bg-blue-700 text-white text-end").replace("bg-", "bg-gray-")

  return (
    <li className={liStyles}>
      <div className="flex ">
        <time >
          {message.sentAt.toLocaleTimeString("en-AU", {
            timeStyle: "short",
          })}{" "}
          - <strong className={message.sender.name === session.user?.name ? "text-indigo-500" : "text-black"}>{message.sender.name} </strong>
        </time>
      </div>
      {message.message}
    </li>
  )
}

function RoomPage() {
  const { query } = useRouter()
  const roomId = query.roomId as string
  const { data: session } = useSession()

  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

  const { mutateAsync: sendMessageMutation } = trpc.useMutation([
    "room.send-message",
  ])

  trpc.useSubscription(
    [
      "room.onSendMessage",
      {
        roomId,
      },
    ],
    {
      onNext: (message) => {
        setMessages((m) => {
          return [...m, message]
        })
      },
    }
  )

  if (!session) {
    return (
      <div>
        <button onClick={() => signIn()}>Login</button>
      </div>
    )
  }

  return (
    <>
      <Head>
        <link href="https://api.fontshare.com/v2/css?f[]=space-grotesk@1,300,700,500,400,600&display=swap" rel="stylesheet" />

      </Head>
      <div className="flex flex-col h-full pb-20">
        <div className="flex-1">
          <ul className="flex flex-col p-4">
            {messages.map((m) => {
              return <MessageItem key={m.id} message={m} session={session} />
            })}
          </ul>
        </div>

        <form
          className="flex p-4 fixed bottom-0 right-0 w-full"
          onSubmit={(e) => {
            console.log("submity")
            e.preventDefault()

            sendMessageMutation({
              roomId,
              message,
            })

            setMessage("")
          }}
        >
          <textarea
            className="black p-2.5 w-full text-white bg-gray-800 rounded-full font-medium  border-none focus:border-none active:border-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What do you want to say"
          />

          <button className="flex-1 ml-5 text-white font-semibold bg-blue-600 p-2.5 rounded-full" type="submit">
            Send message
          </button>
        </form>
      </div>
    </>
  )
}

export default RoomPage
