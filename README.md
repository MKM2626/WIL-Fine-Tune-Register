# WIL Fine Tune Register

This is a fine tune register to allow cybersecurity analysts to create, manage and track changes to cybersecurity rules

## Features 
### Core Operations
* Create    -   Add new fine tune entry
* Edit      -   Edit analyst, comment, and fine tune (depending on if it has been set to finalised)
* Update    -   Create a new version of an existing fine tune entry
* Delete    -   Delete a fine tune entry

### Global Operations
* Global Create:
    Allows you to create a fine tune suggestion for all customers with the same technology

* Global Update:
    Allows you to create a fine tune suggestion of a specific rule for all custommers with the same technology

* Fine Tune Finalisation: 
    Can edit fine tune, but not once it has been finalised

### Search and sort
* Search: 
    Can search by rules, customers, and technologies
* Sort: 
    Allows you to sort by date, descending or ascending
* Filter: 
    Allows you to filter your search by a date range

### Highlight Fine Tune Changes
* Highligh Fine Tune Changes


## Requirments 
Before installing the project, you must have: 
* Node.js: Version 20.
* pnpm: This project uses pnpm as the package manage. Make sure to install it. 
    `npm install -g pnpm`


## Installation 
### 1. Clone the repository 
run `git clone <(https://github.com/MKM2626/WIL-Fine-Tune-Register.git)>`

### 2. Install dependencies
run `pnpm install` to install all the required packages

### 4. Setup the Database
To create the database run `pnpm drizzle-kit push`
to seed the database rune `pnpm run db:reset`

### 5. Start the Server
To launch the local server run `pnpm run dev`