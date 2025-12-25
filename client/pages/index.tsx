import React from 'react'

function index() {

  const [message, setMessage] = React.useState("");
  const [people, setPeople] = React.useState([]);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/home`).then(
      response => response.json()
    ).then(
      data => {
        setMessage(data.message);
        setPeople(data.people);
      }
    )
  }, [])

  return (
    <div>
      <div>{message}</div>
      {
        people.map((person, index) => (
          <div key={index}>{person}</div>
        ))
      }
    </div>
  )
}

export default index
