_Note: At times the chat might go haywire or the model might hallucinate. If that happens, start a new chat using the refresh button on the top right corner._

# Dental ChatBot

## Demo Links

1. Introduction (4o) - https://www.loom.com/share/d0526e3b0a3148e685ab8c19a8ed70e3?sid=dcc7c7f9-8fba-4542-af29-6246d5d0e772
2. Make an appointment (3.5-turbo) - https://www.loom.com/share/b31332847f584c31b77e98ba2c288399?sid=a60b618c-1422-4e69-ad5c-81efc23ee3d9
3. Rescheduling and Cancellation (4o) - https://www.loom.com/share/a0e5950e555f45a2aecb5611d959baa4?sid=4afbda25-61e5-4375-80e2-34b282306ddb
4. Back 2 Back Appoiintments (4o) - https://www.loom.com/share/863598aa52f843d8af54bd08c9ee8da2?sid=82edf16c-da70-4521-9f57-aedca3b8d881
5. Emergency (4o) (no audio) - https://www.loom.com/share/ab878a1c27c94500b5f72cd0b927feff?sid=ba5728a5-52c1-4291-a641-15c9d9bea72c
6. General Questions (4o) - https://www.loom.com/share/c18bc84dd9eb4326a94c3d20d03da07b?sid=d120f036-65f9-4f5e-b1f6-97681679ea3f

At the end of the General questions video, the response was that the chatbot cannot submit the reponse to admin, please contact frontdesk (along with the contact number). This is right as bot was not provided with a function to do that.


## Tech Stack

**Frontend:** NextJs, TailwindCSS  
**Backend:** NodeJs, Typescript, MongoDB  
**AI Stack:** OpenAI GPT-4o, Assistant, Function Calling


## To test the chatbot:
1. Add the env vars (shared in the email) in the `/backend/.env.dev` file.
2. Once you are in the folder, `ls` to check whether backend and frontend folders are present.
3. Then run `yarn install` to install the dependencies.
4. Then run `yarn start` to start the chatbot.
5. Initialize the mongoDb with slots, hit this api locally on postman:
```
curl --location --request POST 'http://localhost:3001/api/slots/slots-for-the-month'
```

(Although I have created for the first run, you can hit this api anytime to reinitialize the slots)

6. On your browser go to http://localhost:3000/ for the chat interface
7. For notifications, go to http://localhost:3000/notifs/admin for admin notifications
8. And http://localhost:3000/notifs/{phone_number} for patient notifications




## Design Architecture:

![Screenshot 2025-04-07 at 10 34 36 AM](https://github.com/user-attachments/assets/ea1ebd2b-f5f4-4141-af8d-37e5f852ee63)



Consists of 5 collections: Patients, Appointments, Slots, Notifications, Billing.

Whenever using the chat interface, it will initialize the chat with the existing chat thread. To start new chat, use the refresh button on the top right corner, which will create a new thread.

On entering the message, the `/chat` api takes the message to the OpenAI assistant, DentalChatbot. The chatbot based on the user prompt, might be able to answer questions directly, or will call a tool (functions) for one out of the 2 purposes: to execute an operation, or to get information.

Once executed, the response of the execution will be fed again into the assistant, and the assistant will again respond with a response, or call a tool again.

Once all tool calls are over, the assistant will respond with the final response.

## Technical Decisions

1. Started of with Chat Completions, but switched to assistants, resulting in significant improvements in quality of responses.
2. Chose gpt-4o model over 3.5-turbo, for way better quality despite higher token consumption.
3. Billing and Appointments have one to many relationship, so that multiple appointments can be made by one payment.
4. Appointments and Slots have one to one relationship, so that each appointment is allotted a slot.
5. To relate patients, dependants have a contact ref field to identify the parent patient.
6. Start times are static for each slot, duration is fixed to 1hr for every appointment.
7. Considering cost of each appointment type to be the same, this helps in keeping rescheduling easy as arrears in pricing across slots do not have to adjusted, for simplicity sake.
