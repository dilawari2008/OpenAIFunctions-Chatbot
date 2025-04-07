# Dental ChatBot

## Demo Links


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


**Note:** At times the chat might go haywire or the model might hallucinate. If that happens, start a new chat using the refresh button on the top right corner.

## Technical Decisions

1. Started of with Chat Completions, but switched to assistants, resulting in significant improvements in quality of responses.
2. Chose gpt-4o model over 3.5-turbo, for way better quality despite higher token consumption.
3. Billing and Appointments have one to many relationship, so that multiple appointments can be made by one payment.
4. Appointments and Slots have one to one relationship, so that each appointment is allotted a slot.
5. To relate patients, dependants have a contact ref field to identify the parent patient.
6. Start times are static for each slot, duration is fixed to 1hr for every appointment.
7. Considering cost of each appointment type to be the same, this helps in keeping rescheduling easy as arrears in pricing across slots do not have to adjusted, for simplicity sake.
