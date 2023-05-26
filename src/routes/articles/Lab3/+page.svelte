<script>
 let code = `
        /**
    * @file demo1.ino
    * @brief This file contains the code for Lab03 demo1. The authors of this file are Mason Wheeler and Joey Pirich.
    */
   
   #include "RR.h"
   
   int reset1 = 0;
   int reset2 = 0;
   
   // sets the OCR4A to make the clock cycle frequency
   // the same as the input freq
   void setOC4AFreq(uint32_t freq) {
     PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
     TIMER_COUNTER = 0;
   }
   
   void task1() {
     static unsigned long time;
     time++;
   
     // reset everything given a reset signal
     if (reset1) {
       LED_PORT |= BIT2;
       time = 0;
       reset1 = 0;
       return;
     }
   
     // flash led on pin 47 for FLASH_DURATION
     if (time == (0 * FLASH_DURATION) + 1) {
       LED_PORT &= ~BIT2;
     }
   
     if (time == (1 * FLASH_DURATION) + 1) {
       LED_PORT |= BIT2;
     }
   
     if (time == 1000) {
       time = 0;
     }
   
     return;
   }
   
   void task2() {
     static unsigned long time;
     time++;
   
     if (reset2) {
       setOC4AFreq(0);
       time = 0;
       reset2 = 0;
       return;
     }
   
     // play tone
     for (int i = 0; i < NMELODY; i++) {
       if (time == ((unsigned long) i * PLAY_DURATION) + 1) {
         setOC4AFreq(melody[i]);
       }
     }
   
     // stop playing for 4 seconds
     if (time == ((unsigned long) NMELODY * PLAY_DURATION) + 1) {
       setOC4AFreq(0);
     }
   
     // start playing after 4 seconds
     for (int i = 0; i < NMELODY; i++) {
       if (time == (PICKUP_TIME + (unsigned long) i * PLAY_DURATION) + 1) {
         setOC4AFreq(melody[i]);
       }
     }
   
     // reset
     if (time == (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION) + 1) {
       time = 0;
     }
   }
   
   /// Initializes everything needed for the tasks
   void setup() {
     // clear timer settings
     TIMER_REG_A = 0;
     TIMER_REG_B = 0;
     // set our timer to work in CTC mode
     TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
     TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);
   
     // set timer to work in toggle mode
     TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);
   
     // disable interrupts on the timer
     TIMER_MASK = 0;
   
     // set the prescaler of the timer,
     // which follows the formula:
     //
     //  f_out = f_i/o / 2 * N * (PRESCALER + 1)
     //
     // because f_i/o = 16Mhz, we'll just set N = 1
     TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
     PRESCALER = 0;
     TIMER_COUNTER = 0;
   
     // OC4A is tied to pin 6, which is controlled by PH3
     // set pin 6 as an output pin
     SPEAKER_DDR |= BIT3;
   
     // set output pins for task1
     LED_DDR |= BIT0;
     LED_DDR |= BIT1;
     LED_DDR |= BIT2;
   }
   
   /// Scheduler loop
   void loop() {
     while(1) {
     task1();
     task2();
     delayMicroseconds(700);
   }
   }
   

/**
    * @file demo2.ino
    * @brief This file was authored by Mason Wheeler and Joey Pirich.
    * 
    * This file contains the implementation of a scheduler loop that runs multiple tasks in a cooperative multitasking fashion.
    * It also includes functions for putting tasks to sleep and waking them up after a specified amount of time.
    * 
    */
   #include "SRRI.h"
   
   int reset1 = 0;
   int reset2 = 0;
   
   void (* taskArr[NTASKS]) ();
   volatile int sFlag = PENDING;
   volatile int currTask;
   volatile int sleepArr[NTASKS];
   volatile int stateArr[NTASKS];
   volatile long timeArr[NTASKS];
   
   /// Initializes all necessary i/o parts
   void setup() {
     // get all our outputs set up
     interruptSetup();
     speakerSetup();
     ledSetup();
   
     // populate task array
     for (int i = 0; i < NTASKS; i++) {
       taskArr[i] = NULL;
       timeArr[i] = 0;
       stateArr[i] = READY;
       sleepArr[i] = 0;
     }
     taskArr[0] = task1;
     taskArr[1] = task2;
     taskArr[NTASKS-2] = schedule_sync;
     Serial.begin(9600);
   }
   
   /// Scheduler loop
   void loop() {
     for (int i = 0; i < NTASKS; i++) {
       if (taskArr[i] != NULL && stateArr[i] == READY) {
         // start up this task
         stateArr[i] = RUNNING;
         currTask = i;
         (*taskArr[i])();
   
   
         // tear down
         if (stateArr[i] == RUNNING) stateArr[i] = READY;
       }
     }
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the Timer 3 Interrupt function.
    * 
    * This function is called by the Timer 3 Interrupt and sets the sFlag to DONE.
    * 
    */
   
   /**
    * @brief Timer 3 Interrupt function.
    * 
    * This function is called by the Timer 3 Interrupt and sets the sFlag to DONE.
    * 
    */
   ISR(TIMER3_COMPA_vect) {
     sFlag = DONE; // Set the sFlag to DONE
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the sleep_474 function.
    * 
    * This function puts the current task to sleep for a specified amount of time.
    * 
    */
   
   /**
    * @brief Puts the current task to sleep for a specified amount of time.
    * 
    * @param t The amount of time to sleep for, in milliseconds.
    * 
    * @return void
    */
   void sleep_474(long t) {
     // sleep array @ [function index], set value to t
     sleepArr[currTask] = t;
     // state array @ [function index], set state to SLEEPING
     stateArr[currTask] = SLEEPING;
     return;
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the schedule_sync function.
    * 
    * This function updates the remaining sleep time for each sleeping task and wakes up any sleeping tasks
    * whose remaining sleep time has elapsed. It also updates the timeArr for each task and resets the sFlag.
    * 
    */
   
   /**
    * @brief Updates the remaining sleep time for each sleeping task and wakes up any sleeping tasks
    * whose remaining sleep time has elapsed. It also updates the timeArr for each task and resets the sFlag.
    * 
    * @return void
    */
   void schedule_sync() {
     // wait for sFlag to be set to DONE
     while (sFlag == PENDING) {
       3 + 5;
     }
   
     // update sleep time and wake up sleeping tasks
     for (int i = 0; i < NTASKS; i++) {
       // update remaining sleep time
       if (stateArr[i] == SLEEPING) {
         sleepArr[i] -= 2;
         // wake up any sleeping tasks
         if (sleepArr[i] < 2) {
           // reset to t = 0 in sleep array
           sleepArr[i] = 0;
           // change corresponding state from SLEEPING to READY
           stateArr[i] = READY;
         }
       }
   
       // update timeArr for each task
       timeArr[i] += 2;
     }
   
     // reset sFlag
     sFlag = PENDING;
     return;
   }
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the setOC4AFreq function.
    * 
    * This function sets the OCR4A to make the clock cycle frequency the same as the input frequency.
    * 
    */
   
   /**
    * @brief Sets the OCR4A to make the clock cycle frequency the same as the input frequency.
    * 
    * @param freq The desired frequency of the clock cycle.
    * 
    * @return void
    */
   void setOC4AFreq(uint32_t freq) {
     // Calculate the prescaler value based on the desired frequency
     PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
     
     // Reset the timer counter
     TIMER_COUNTER = 0;
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the task1 function.
    * 
    * This function flashes an LED on pin 47 for a certain duration, and then turns it off for a certain duration.
    * 
    */
   
   /**
    * @brief Flashes an LED on pin 47 for a certain duration, and then turns it off for a certain duration.
    * 
    * @param None
    * 
    * @return void
    */
   void task1() {
     // reset everything given a reset signal
     if (reset1) {
       LED_PORT |= BIT2;
       timeArr[currTask] = 0;
       reset1 = 0;
       return;
     }
   
     // flash led on pin 47 for FLASH_DURATION
     if (timeArr[currTask] < (1 * FLASH_DURATION) + 1) {
       LED_PORT &= ~BIT2;
       sleep_474(250);
       return;
     }
   
     // turn off led for PAUSE_DURATION
     if (timeArr[currTask] < (2 * FLASH_DURATION) + 1) {
       LED_PORT |= BIT2;
       sleep_474(750);
       return;
     }
   
     // reset timeArr after 1000ms
     if (timeArr[currTask] >= 1000) {
       timeArr[currTask]= 0;
     }
   
     return;
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the task2 function.
    * 
    * This function plays a melody using the setOC4AFreq function.
    * 
    */
   
   /**
    * @brief Plays a melody using the setOC4AFreq function.
    * 
    * @param None
    * 
    * @return void
    */
   void task2() {
     // reset everything given a reset signal
     if (reset2) {
       setOC4AFreq(0);
       timeArr[currTask] = 0;
       reset2 = 0;
       return;
     }
   
     // play tone
     for (int i = 0; i < NMELODY; i++) {
       if ( timeArr[currTask] >= ((unsigned long) i * PLAY_DURATION) &&
         timeArr[currTask] < (((unsigned long) i + 1) * PLAY_DURATION) ) {
         setOC4AFreq(melody[i]);
         sleep_474(PLAY_DURATION);
         return;
       }
     }
   
     // stop playing for 4 seconds
     if (timeArr[currTask] < PICKUP_TIME) {
       setOC4AFreq(0);
       sleep_474(PAUSE_DURATION);
       return;
     }
   
     // start playing after 4 seconds
     for (int i = 0; i < NMELODY; i++) {
       if (timeArr[currTask] >= (PICKUP_TIME + ((unsigned long) i) * PLAY_DURATION) &&
           timeArr[currTask] < (PICKUP_TIME + ((unsigned long) i + 1) * PLAY_DURATION)) {
         setOC4AFreq(melody[i]);
         sleep_474(PLAY_DURATION);
         return;
       }
     }
   
     // reset
     if (timeArr[currTask] >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION)) {
       timeArr[currTask] = 0;
     }
   }
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the interruptSetup function.
    */
   
   /**
    * @brief Sets up the timer interrupt for the speaker.
    * 
    * This function sets up the timer interrupt for the speaker by configuring the timer
    * to work in CTC mode, enabling interrupts on counter A, setting the frequency of the timer,
    * and enabling interrupts.
    * 
    * @param None
    * 
    * @return void
    */
   void interruptSetup() {
     // reset settings
     TCCR3A = 0;
     TCCR3B = 0;
   
     // set timer to work in CTC mode
     TCCR3A |= (0 << WGM31) | (0 << WGM30);
     TCCR3B |= (0 << WGM33) | (1 << WGM32);
     TCCR3A |= (0 << COM3A1) | (1 << COM3A0);
   
     // enable interrupt on counter A
     TIMSK3 |= (1 << OCIE3A);
   
     // set frequency of timer
     TCCR3B |= (0 << CS32) | (0 << CS31) | (1 << CS30);
     // TCCR3B |= (1 << CS32) | (0 << CS31) | (1 << CS30); // 1024
     // OCR3A =  7812; // should make around 1 hz
     OCR3A = 32000;
     TCNT3H = 0;
   
     // enable interrupts
     SREG |= (1<<7);
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the speakerSetup function.
    */
   
   /**
    * @brief Sets up the speaker timer for generating sound.
    * 
    * This function sets up the speaker timer to work in CTC mode, toggle mode, and with a specific
    * prescaler. It also sets the output pin for the speaker.
    * 
    * @param None
    * 
    * @return void
    */
   void speakerSetup() {
     // clear timer settings
     TIMER_REG_A = 0;
     TIMER_REG_B = 0;
   
     // set our timer to work in CTC mode
     TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
     TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);
   
     // set timer to work in toggle mode
     TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);
   
     // disable interrupts on the timer
     TIMSK4 = 0;
   
     TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
     PRESCALER = 0;
     TIMER_COUNTER = 0;
   
     // OC4A is tied to pin 6, which is controlled by PH3
     // set pin 6 as an output pin
     SPEAKER_DDR |= BIT3;
   }
   
   /**
    * @file demo2.ino
    * @brief This file contains the implementation of the ledSetup function.
    */
   
   /**
    * @brief Sets up the LED output pin for task1.
    * 
    * This function sets up the LED output pin for task1 by setting the corresponding
    * pin in the LED_DDR register to be an output pin.
    * 
    * @param None
    * 
    * @return void
    */
   void ledSetup() {
     // set output pins for task1
     LED_DDR |= BIT2; // set bit 2 in LED_DDR to 1 to make it an output pin
   }

    /**
 * @file demo3.ino
 * @brief This file contains the implementation of a multitasking system using DDS and Timer 3 Interrupt.
 * 
 * This file defines the necessary constants, variables, and functions to implement a multitasking system using DDS and Timer 3 Interrupt. The system is capable of running up to 10 tasks, each with its own state and function pointer. The DDS is used to generate a square wave signal with a frequency of 1 kHz, which is used to trigger the Timer 3 Interrupt. The Timer 3 Interrupt sets a flag that is used to synchronize the execution of the tasks. The system also includes functions to load, start, and find dead tasks, as well as interrupt, speaker, and LED setup functions.
 * 
 */

#include "DDS.h"

// Define the number of tasks
#define NTASKS 10

// Define the possible states of a task
#define DEAD 0
#define READY 1
#define RUNNING 2
#define SLEEPING 3

volatile FLAG sFlag;

// Define the taskArr and deadTasks arrays
tcb taskArr[NTASKS];
tcb deadTasks[NTASKS];

// Define the id and currTask variables
volatile int id;
volatile int currTask;

// Define the reset1 and reset2 variables
int reset1 = 0;
int reset2 = 0;

// Setup function
void setup() {
  // Initialize the id variable
  id = 0;

  // Setup the interrupts, speaker, and LED
  interruptSetup();
  speakerSetup();
  ledSetup();

  // Setup the DDS
  DDSSetup();

  // Load the tasks
  task_load(task1, "task 1");
  task_load(task2, "task 2");
  task_load(schedule_sync, "schedule_sync");

  // Start the tasks
  task_start(find_dead_task("task 1"));
  task_start(find_dead_task("task 2"));
  task_start(find_dead_task("schedule_sync"));
}

// Loop function
void loop() {
  // Iterate through the taskArr array
  for (int i = 0; i < NTASKS; i++) {
    // Check if the task is ready to run
    if (taskArr[i].fn_ptr != NULL && taskArr[i].state == READY) {
      // Start the task
      taskArr[i].state = RUNNING;
      currTask = i;
      taskArr[i].nTimes++;
      (*(taskArr[i].fn_ptr))();

      // Tear down the task
      if (taskArr[i].state == RUNNING) taskArr[i].state = READY;
    }
  }
}

/**
 * @file demo3.ino
 * @brief This file contains the implementation of the Timer 3 Interrupt function.
 * 
 * This function is called by the Timer 3 Interrupt and sets the sFlag to DONE.
 * 
 */

/**
 * @brief Timer 3 Interrupt function.
 * 
 * This function is called by the Timer 3 Interrupt and sets the sFlag to DONE.
 * 
 */
ISR(TIMER3_COMPA_vect) {
  sFlag = DONE; // Set the sFlag to DONE
}

/**
 * @file demo3.ino
 * @brief This file contains the implementation of the find_dead_task function.
 * 
 * This function searches the deadTasks array for a task with the given name and returns a pointer to its TCB.
 * 
 */

/**
 * @brief Finds a dead task with the given name and returns a pointer to its TCB.
 * 
 * This function searches the deadTasks array for a task with the given name and returns a pointer to its TCB.
 * 
 * @param name The name of the task to search for.
 * @return A pointer to the TCB of the dead task with the given name, or NULL if no such task is found.
 */
tcb * find_dead_task(const char * name) {
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (strcmp(name, deadTasks[i].name) == 0) break;
  }

  if (i == NTASKS) return NULL;

  return &(deadTasks[i]);
}

/**
 * @brief Copies the contents of one TCB to another.
 * 
 * This function copies the contents of one TCB (Task Control Block) to another. It copies the function pointer, name,
 * ID, number of times executed, state, time, and timeSleep from the source TCB to the destination TCB.
 * 
 * @param dst Pointer to the destination TCB.
 * @param src Pointer to the source TCB.
 * @return void
 */
void copy_tcb(tcb * dst, tcb * src) {
  // Copy the function pointer
  dst->fn_ptr = src->fn_ptr;

  // Copy the name
  strcpy(dst->name, src->name);

  // Copy the ID
  dst->id = src->id;

  // Copy the number of times executed
  dst->nTimes = src->nTimes;

  // Copy the state
  dst->state = src->state;

  // Copy the time
  dst->time = src->time;

  // Copy the sleep time
  dst->timeSleep = src->timeSleep;
}

/**
 * @brief Removes the current task from the task array and adds it to the dead task array.
 * 
 * This function removes the current task from the task array and adds it to the dead task array. It first finds an
 * open slot in the dead task array and copies the current task's tcb to that slot. It then clears all values in the
 * task array for the current task. Finally, it sets the current task's state to DEAD.
 * 
 * @param None
 * @return void
 */
void task_self_quit() {
  // find a spot in the dead array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  // If there's no space, don't do anything
  if (i == NTASKS) return;

  // Copy the current task's tcb to the dead task array
  copy_tcb(&(deadTasks[i]), &(taskArr[currTask]));
  deadTasks[i].state = DEAD;

  // Clear all values in the task array for the current task
  taskArr[currTask].fn_ptr = NULL;
  strcpy(taskArr[currTask].name, "");
  taskArr[currTask].id = 0;
  taskArr[currTask].nTimes = 0;
  taskArr[currTask].time = 0;
  taskArr[currTask].timeSleep = 0;
  taskArr[currTask].state = DEAD;
}


/**
 * @brief Starts a task by copying it from the dead task array to the task array and setting its state to READY.
 * 
 * This function starts a task by copying it from the dead task array to the task array and setting its state to READY.
 * It first checks if the given task is NULL or if its state is not DEAD. If either of these conditions is true, the
 * function returns without doing anything. Otherwise, it finds the next open slot in the task array and copies the
 * task to that slot. It then sets the task's state to READY and sets the original task's state to DEAD.
 * 
 * @param task A pointer to the task control block (tcb) of the task to start.
 * @return void
 */
void task_start(tcb * task) {
  // Check if the task is NULL or if its state is not DEAD
  if (task == NULL || task->state != DEAD) return;

  // Find the next open slot in the task array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (taskArr[i].fn_ptr == NULL) break;
  }

  // If there's no space, don't do anything
  if (i == NTASKS) return;

  // Copy the task to the task array and set its state to READY
  copy_tcb(&(taskArr[i]), task);
  taskArr[i].state = READY;

  // Set the original task's state to DEAD
  task->state = DEAD;
}


/**
 * @brief Loads a new task into the dead task array.
 * 
 * This function loads a new task into the dead task array. It finds the next open slot in the dead task array,
 * and if there is space, it loads up a new task with the given function pointer and name. It also initializes
 * the task's ID, number of times run, time slept, time run, and state.
 * 
 * @param fn_ptr A function pointer to the task's function.
 * @param name A string representing the name of the task.
 * @return void
 */
void task_load(void (*fn_ptr)(), const char * name) {
  // find the next open slot in the dead task array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  // if there's no space, don't do anything
  if (i == NTASKS) return;

  // load up a new task
  strcpy(deadTasks[i].name, name);
  deadTasks[i].fn_ptr = fn_ptr;
  deadTasks[i].id = id;
  id++;
  deadTasks[i].nTimes = 0;
  deadTasks[i].timeSleep = 0;
  deadTasks[i].time = 0;
  deadTasks[i].state = DEAD;
}

/**
 * @brief Puts the current task to sleep for a specified amount of time.
 * 
 * This function puts the current task to sleep for a specified amount of time. It sets the current task's
 * timeSleep value to the specified time and its state to SLEEPING. When the task is woken up, it will resume
 * execution from where it left off.
 * 
 * @param t The amount of time to sleep, in milliseconds.
 * @return void
 */
void sleep_474(long t) {
  // sleep array @ [function index], set value to t
  taskArr[currTask].timeSleep = t;
  // state array @ [function index], set state to SLEEPING
  taskArr[currTask].state = SLEEPING;
  return;
}


/**
 * @brief Synchronizes the task scheduler with the system clock.
 * 
 * This function synchronizes the task scheduler with the system clock by updating the remaining sleep time
 * for any sleeping tasks and waking up any sleeping tasks whose remaining sleep time has elapsed. It also
 * updates the time for all tasks and resets the sFlag.
 * 
 * @param None
 * @return void
 */
void schedule_sync() {
  // wait until sFlag is no longer PENDING
  while (sFlag == PENDING) {
    3 + 5;
  }

  // update remaining sleep time for any sleeping tasks and wake up any sleeping tasks whose remaining sleep time has elapsed
  for (int i = 0; i < NTASKS; i++) {
    if (taskArr[i].state == SLEEPING) {
      // decrement remaining sleep time by 2
      taskArr[i].timeSleep -= 2;

      // wake up any sleeping tasks whose remaining sleep time has elapsed
      if (taskArr[i].timeSleep < 2) {
        // reset remaining sleep time to 0
        taskArr[i].timeSleep = 0;

        // change corresponding task state from SLEEPING to READY
        taskArr[i].state = READY;
      }
    }

    // update time for all tasks
    taskArr[i].time += 2;
  }

  // reset sFlag to PENDING
  sFlag = PENDING;
  return;
}



/**
 * @brief Sets the OCR4A to make the clock cycle frequency the same as the input frequency.
 * 
 * This function sets the OCR4A to make the clock cycle frequency the same as the input frequency.
 * It calculates the prescaler value based on the input frequency and sets the TIMER_COUNTER to 0.
 * 
 * @param freq The input frequency to set the OCR4A to.
 * @return void
 */
void setOC4AFreq(uint32_t freq) {
  // calculate the prescaler value based on the input frequency
  PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
  // set the TIMER_COUNTER to 0
  TIMER_COUNTER = 0;
}



/**
 * @brief Flashes an LED on pin 47 for a certain duration.
 * 
 * This function flashes an LED on pin 47 for a certain duration. If a reset signal is received,
 * it resets the time and turns off the LED. Otherwise, it flashes the LED for a certain duration
 * and then turns it off for another duration.
 * 
 * @return void
 */
void task1() {
  // reset everything given a reset signal
  if (reset1) {
    LED_PORT |= BIT2; // turn off LED
    taskArr[currTask].time = 0; // reset time
    reset1 = 0; // reset reset signal
    return;
  }

  // flash led on pin 47 for FLASH_DURATION
  if (taskArr[currTask].time < (1 * FLASH_DURATION) + 1) {
    LED_PORT &= ~BIT2; // turn on LED
    sleep_474(250); // sleep for 250ms
    return;
  }

  if (taskArr[currTask].time < (2 * FLASH_DURATION) + 1) {
    LED_PORT |= BIT2; // turn off LED
    sleep_474(750); // sleep for 750ms
    return;
  }

  if (taskArr[currTask].time >= 1000) {
    taskArr[currTask].time = 0; // reset time
  }

  return;
}

/**
 * @brief Plays a melody on the speaker.
 * 
 * This function checks the current time and plays the corresponding note in the melody.
 * If the melody has finished playing, it resets the time.
 * 
 * @return void
 */
void task2() {
  if (reset2) {
    setOC4AFreq(0);
    taskArr[currTask].time = 0;
    reset2 = 0;
    return;
  }

  for (int i = 0; i < NMELODY; i++) {
    if ( taskArr[currTask].time >= ((unsigned long) i * PLAY_DURATION) &&
      taskArr[currTask].time < (((unsigned long) i + 1) * PLAY_DURATION) ) {
      setOC4AFreq(melody[i]);
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  if (taskArr[currTask].time < PICKUP_TIME) {
    setOC4AFreq(0);
    sleep_474(PAUSE_DURATION);
    return;
  }

  for (int i = 0; i < NMELODY; i++) {
    if (taskArr[currTask].time >= (PICKUP_TIME + ((unsigned long) i) * PLAY_DURATION) &&
        taskArr[currTask].time < (PICKUP_TIME + ((unsigned long) i + 1) * PLAY_DURATION)) {
      setOC4AFreq(melody[i]);
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  if (taskArr[currTask].time >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION)) {
    taskArr[currTask].time = 0;
  }
}

/**
 * @brief Sets up the interrupt for the speaker.
 * 
 * This function sets up the timer to work in toggle mode and enables interrupts.
 * 
 * @return void
 */
void interruptSetup() {
  TCCR3A = 0; // clear timer control register A
  TCCR3B = 0; // clear timer control register B

  // set waveform generation mode
  TCCR3A |= (0 << WGM31) | (0 << WGM30);
  TCCR3B |= (0 << WGM33) | (1 << WGM32);

  // set timer to work in toggle mode
  TCCR3A |= (0 << COM3A1) | (1 << COM3A0);

  // enable output compare interrupt
  TIMSK3 |= (1 << OCIE3A);

  // set prescaler to 1 and timer counter to 0
  TCCR3B |= (0 << CS32) | (0 << CS31) | (1 << CS30);
 
  OCR3A = 32000; // set output compare register to 32000
  TCNT3H = 0; // clear timer counter high byte

  // enable interrupts
  SREG |= (1<<7);
}


/**
 * @brief Sets up the speaker.
 * 
 * This function sets up the timer to work in toggle mode and sets the prescaler and counter to 0.
 * 
 * @return void
 */
void speakerSetup() {
  TIMER_REG_A = 0; // clear timer register A
  TIMER_REG_B = 0; // clear timer register B

  // set waveform generation mode
  TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
  TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);

  // set timer to work in toggle mode
  TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);

  TIMSK4 = 0; // disable timer interrupts

  // set prescaler and timer counter to 0
  TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
  PRESCALER = 0;
  TIMER_COUNTER = 0;

  SPEAKER_DDR |= BIT3; // set speaker pin as output
}


/**
 * @brief Initializes the LED pin as an output.
 * 
 * This function sets the LED pin as an output by setting the corresponding bit in the LED_DDR register.
 * 
 * @return void
 */
void ledSetup() {
  LED_DDR |= BIT2; // set LED pin as output
}


/**
 * @brief Initializes the task array and dead task array.
 * 
 * This function initializes the task array and dead task array by setting all the values to their default values.
 * 
 * @return void
 */
void DDSSetup() {
  for (int i = 0; i < NTASKS; i++) {
    taskArr[i].fn_ptr = NULL; // function pointer
    taskArr[i].id = 0; // task ID
    taskArr[i].nTimes = 0; // number of times task has run
    taskArr[i].timeSleep = 0; // time to sleep before running task
    taskArr[i].time = 0; // current time of task
    taskArr[i].state = DEAD; // state of task
    deadTasks[i].fn_ptr = NULL; // function pointer
    deadTasks[i].id = 0; // task ID
    deadTasks[i].nTimes = 0; // number of times task has run
    deadTasks[i].timeSleep = 0; // time to sleep before running task
    deadTasks[i].time = 0; // current time of task
    deadTasks[i].state = DEAD; // state of task
  }
}



    /**
 * @file demo4.ino
 * @brief This file contains the code for a scheduler that manages multiple tasks on an Arduino board. 
 * The authors of this file are Mason Wheeler and Joey Pirich.
 */

#include "SRRI.h"

int reset1 = 0;
int reset2 = 0;

void (* taskArr[NTASKS]) ();
volatile int sFlag = PENDING;
volatile int currTask;
volatile int sleepArr[NTASKS];
volatile int stateArr[NTASKS];
volatile long timeArr[NTASKS];

/// Initializes all necessary i/o parts
void setup() {
  // get all our outputs set up
  interruptSetup();
  speakerSetup();
  ledSetup();
  displaySetup();

  // populate task array
  for (int i = 0; i < NTASKS; i++) {
    taskArr[i] = NULL;
    timeArr[i] = 0;
    stateArr[i] = READY;
    sleepArr[i] = 0;
  }
  taskArr[0] = task1;
  taskArr[1] = task2;
  taskArr[2] = task3;
  taskArr[NTASKS-2] = schedule_sync;
  // Serial.begin(9600);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

/// Scheduler Loop
void loop() {
  for (int i = 0; i < NTASKS; i++) {
    if (taskArr[i] != NULL && stateArr[i] == READY) {
      // start up this task
      stateArr[i] = RUNNING;
      currTask = i;
      (*taskArr[i])();


      // tear down
      if (stateArr[i] == RUNNING) stateArr[i] = READY;
    }
  }
}

/**
 * @brief Timer 3 Compare A Interrupt Service Routine (ISR)
 * 
 * This ISR sets the sFlag to DONE when the Timer 3 Compare A interrupt is triggered.
 * 
 * @param TIMER3_COMPA_vect Interrupt vector for Timer 3 Compare A
 * 
 * @return void
 */
ISR(TIMER3_COMPA_vect) {
  sFlag = DONE;
}


/**
 * @brief Sleeps the current task for a specified amount of time
 * 
 * This function sets the sleep time of the current task to the specified time and changes its state to SLEEPING.
 * 
 * @param t The amount of time to sleep the current task for
 * 
 * @return void
 */
void sleep_474(long t) {
  // sleep array @ [function index], set value to t
  sleepArr[currTask] = t;
  // state array @ [function index], set state to SLEEPING
  stateArr[currTask] = SLEEPING;
  return;
}


/**
 * @brief Synchronizes the scheduler with the timer
 * 
 * This function updates the remaining sleep time of each sleeping task and wakes up any sleeping tasks that have finished sleeping.
 * It also updates the time elapsed for each task and resets the sFlag.
 * 
 * @param None
 * 
 * @return void
 */
void schedule_sync() {
  // wait for sFlag to be set to DONE
  while (sFlag == PENDING) {
    3 + 5; // do nothing
  }

  // update each task's sleep time and state
  for (int i = 0; i < NTASKS; i++) {
    // update remaining sleep time
    if (stateArr[i] == SLEEPING) {
      sleepArr[i] -= 2;
      // wake up any sleeping tasks
      if (sleepArr[i] < 2) {
        // reset to t = 0 in sleep array
        sleepArr[i] = 0;
        // change corresponding state from SLEEPING to READY
        stateArr[i] = READY;
      }
    }

    // update time elapsed for each task
    timeArr[i] += 2;
  }

  // reset sFlag
  sFlag = PENDING;
  return;
}


/**
 * @brief Sets the OCR4A to make the clock cycle frequency the same as the input frequency
 * 
 * This function calculates the prescaler value based on the input frequency and sets the OCR4A register accordingly.
 * 
 * @param freq The desired frequency of the clock cycle
 * 
 * @return void
 */
void setOC4AFreq(uint32_t freq) {
  // calculate the prescaler value based on the input frequency
  PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
  // reset the timer counter
  TIMER_COUNTER = 0;
}

/**
 * @brief Flashes an LED on pin 47 for a specified duration
 * 
 * This function flashes an LED on pin 47 for a specified duration. It also resets the time elapsed for the task if a reset signal is received.
 * 
 * @param None
 * 
 * @return void
 */
void task1() {
  // reset everything given a reset signal
  if (reset1) {
    LED_PORT |= BIT2;
    timeArr[currTask] = 0;
    reset1 = 0;
    return;
  }

  // flash led on pin 47 for FLASH_DURATION
  if (timeArr[currTask] < (1 * FLASH_DURATION) + 1) {
    LED_PORT &= ~BIT2;
    sleep_474(250);
    return;
  }

  if (timeArr[currTask] < (2 * FLASH_DURATION) + 1) {
    LED_PORT |= BIT2;
    sleep_474(750);
    return;
  }

  if (timeArr[currTask] >= 1000) {
    timeArr[currTask]= 0;
  }

  return;
}
/**
 * @file demo4.ino
 * @brief This file contains the implementation of the task2 function.
 * 
 * This function plays a melody using the tone function and stops playing for 4 seconds before starting again.
 * 
 */

/**
 * @brief Plays a melody using the tone function and stops playing for 4 seconds before starting again.
 * 
 * @param None
 * 
 * @return void
 */
void task2() {
  // reset everything given a reset signal
  if (reset2) {
    setOC4AFreq(0);
    timeArr[currTask] = 0;
    reset2 = 0;
    return;
  }

  // play tone
  for (int i = 0; i < NMELODY; i++) {
    if ( timeArr[currTask] >= ((unsigned long) i * PLAY_DURATION) &&
      timeArr[currTask] < (((unsigned long) i + 1) * PLAY_DURATION) ) {
      setOC4AFreq(melody[i]);
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  // stop playing for 4 seconds
  if (timeArr[currTask] < PICKUP_TIME) {
    setOC4AFreq(0);
    sleep_474(PAUSE_DURATION);
    return;
  }

  // start playing after 4 seconds
  for (int i = 0; i < NMELODY; i++) {
    if (timeArr[currTask] >= (PICKUP_TIME + ((unsigned long) i) * PLAY_DURATION) &&
        timeArr[currTask] < (PICKUP_TIME + ((unsigned long) i + 1) * PLAY_DURATION)) {
      setOC4AFreq(melody[i]);
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  // reset
  if (timeArr[currTask] >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION)) {
    timeArr[currTask] = 0;
  }
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of the convert function.
 * 
 * This function takes an integer value and separates its digits into an array.
 * 
 */

/**
 * @brief Separates the digits of an integer value into an array.
 * 
 * @param digits An integer array to store the digits of the value.
 * @param val The integer value to separate into digits.
 * 
 * @return void
 */
void convert(int * digits, int val) {
  // Separate the digits of the value and store them in the array
  digits[0] = val % 10;
  digits[1] = (val/10) % 10;
  digits[2] = (val/100) % 10;
  digits[3] = (val/1000) % 10;
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of task3 function.
 * 
 * This function displays a count on a 7-segment display.
 * 
 */

/**
 * @brief Displays a count on a 7-segment display.
 * 
 * @param None
 * 
 * @return void
 */
void task3() {
  static int count; // static variable to keep track of count
  static int digits[4]; // static array to store digits of count
  static int displayStates[4] = {S0, S1, S2, S3}; // static array to store display states

  // take digits out of count
  convert(digits, count); // call convert function to separate digits of count

  // display count on the 7seg display
  for (int h = 0; h < 5; h++) { // loop through 5 times to display each digit
    for (int i = 0; i < 4; i++) { // loop through 4 times to display each segment of the digit
      int pin = 10 + i; // calculate the pin number for the segment
      if ((timeArr[currTask] / 5) >= (4 * h) + i && (timeArr[currTask] / 5) < (4 * h) + (i + 1)) {
        // if it's time to display the segment, turn on the 7-segment display and the specified digit
        PORTB = displayStates[i];
        byte *disp = seven_seg_digits[digits[i]];
        send7(disp);
        sleep_474(2);
        return;
      }
    }
  }

  // reset
  if (timeArr[currTask] >= 100) { // if it's time to reset
    timeArr[currTask] = 0; // reset the time
    count = count == 9999 ? 0 : count + 1; // increment the count or reset it if it's at its maximum value
  }
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of the send7 function.
 * 
 * This function takes an array of 7 bytes and sends them to the 7-segment display.
 * 
 */

/**
 * @brief Sends an array of 7 bytes to the 7-segment display.
 * 
 * @param arr An array of 7 bytes to send to the 7-segment display.
 * 
 * @return void
 */
void send7(byte arr[7]) {
  int data = 0; // initialize a variable to store the data to be sent to the 7-segment display
  for (int i = 0; i < 7; i++) { // loop through each byte in the array
    data |= (arr[i] << i); // set the corresponding bit in the data variable to the value of the byte
  }
  PORTA = data; // send the data to the 7-segment display
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of the interruptSetup function.
 * 
 * This function sets up the timer to generate interrupts at a specified frequency.
 * 
 */

/**
 * @brief Sets up the timer to generate interrupts at a specified frequency.
 * 
 * @param None
 * 
 * @return void
 */
void interruptSetup() {
  // reset settings
  TCCR3A = 0;
  TCCR3B = 0;

  // set timer to work in CTC mode
  TCCR3A |= (0 << WGM31) | (0 << WGM30);
  TCCR3B |= (0 << WGM33) | (1 << WGM32);
  TCCR3A |= (0 << COM3A1) | (1 << COM3A0);

  // enable interrupt on counter A
  TIMSK3 |= (1 << OCIE3A);

  // set frequency of timer
  TCCR3B |= (0 << CS32) | (0 << CS31) | (1 << CS30);
  // TCCR3B |= (1 << CS32) | (0 << CS31) | (1 << CS30); // 1024
  // OCR3A =  7812; // should make around 1 hz
  OCR3A = 32000;
  TCNT3H = 0;

  // enable interrupts
  SREG |= (1<<7);
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of the speakerSetup function.
 * 
 * This function sets up the timer to generate a square wave on the speaker pin.
 * 
 * @param None
 * 
 * @return void
 */
void speakerSetup() {
  // clear timer settings
  TIMER_REG_A = 0;
  TIMER_REG_B = 0;

  // set our timer to work in CTC mode
  TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
  TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);

  // set timer to work in toggle mode
  TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);

  // disable interrupts on the timer
  TIMSK4 = 0;

  // set the prescaler of the timer,
  // which follows the formula:
  //
  //  f_out = f_i/o / 2 * N * (PRESCALER + 1)
  //
  // because f_i/o = 16Mhz, we'll just set N = 1
  TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
  PRESCALER = 0;
  TIMER_COUNTER = 0;

  // OC4A is tied to pin 6, which is controlled by PH3
  // set pin 6 as an output pin
  SPEAKER_DDR |= BIT3;
}

/**
 * @file demo4.ino
 * @brief This file contains the implementation of the displaySetup function.
 * 
 * This function sets up the pins for the 7-segment display and digit selectors.
 * 
 */

/**
 * @brief Sets up the pins for the 7-segment display and digit selectors.
 * 
 * @param None
 * 
 * @return void
 */
void displaySetup() {
  // set up digit selectors
  DDRB |= BIT7 | BIT6 | BIT5 | BIT4; // set pins 4-7 on PORTB as output pins

  // set up 7-seg outputs
  DDRA |= BIT7 | BIT6 | BIT5 | BIT4 | BIT3 | BIT2 | BIT1 | BIT0; // set pins 0-7 on PORTA as output pins

  PORTB |= BIT7 | BIT6 | BIT5 | BIT4; // set pins 4-7 on PORTB to HIGH
}


/**
 * @file demo4.ino
 * @brief This file contains the implementation of the ledSetup function.
 * 
 * This function sets up the output pin for the LED used in task1.
 * 
 * @param None
 * 
 * @return void
 */
void ledSetup() {
  // set output pin for LED used in task1
  LED_DDR |= BIT2;
}


    /**
 * @file demo5.ino
 * @brief This file was authored by Mason Wheeler and Joey Pirich. It contains the implementation of a scheduler loop and various helper functions for task management. 
 */

#include "DDS.h"

int reset1 = 0;
int reset2 = 0;

tcb taskArr[NTASKS];
tcb deadTasks[NTASKS];
volatile int id;
volatile int currTask;
volatile FLAG sFlag;

volatile int currFreq;

/// Initialize outputs
void setup() {
  id = 0;
  // get all our outputs set up
  interruptSetup();
  speakerSetup();
  displaySetup();

  // intialize our task tracking arrays
  DDSSetup();

  task_load(task4, "task4");
  task_load(schedule_sync, "schedule_sync");
  task_start(find_dead_task("task4"));
  task_start(find_dead_task("schedule_sync"));
}

/// Scheduler Loop
void loop() {
  for (int i = 0; i < NTASKS; i++) {
    if (taskArr[i].fn_ptr != NULL && taskArr[i].state == READY) {
      // start up this task
      taskArr[i].state = RUNNING;
      currTask = i;
      (*(taskArr[i].fn_ptr))();
      taskArr[i].nTimes++;

      // tear down
      if (taskArr[i].state == RUNNING) taskArr[i].state = READY;
    }
  }
}

/**
 * @file demo5.ino
 * @brief Interrupt Service Routine for TIMER3_COMPA_vect
 * 
 * This ISR sets the sFlag to DONE when TIMER3_COMPA_vect is triggered.
 * 
 * @return void
 */
ISR(TIMER3_COMPA_vect) {
  sFlag = DONE; // set sFlag to DONE
}


/**
 * @file demo5.ino
 * @brief Function to find a dead task by name
 * 
 * This function searches the deadTasks array for a task with the given name.
 * If found, it returns a pointer to the corresponding tcb struct.
 * 
 * @param name The name of the task to find
 * @return A pointer to the corresponding tcb struct, or NULL if not found
 */
tcb * find_dead_task(const char * name) {
  int i;
  // loop through the deadTasks array to find the task with the given name
  for (i = 0; i < NTASKS; i++) {
    if (strcmp(name, deadTasks[i].name) == 0) break;
  }

  // if the task is not found, return NULL
  if (i == NTASKS) return NULL;

  // otherwise, return a pointer to the corresponding tcb struct
  return &(deadTasks[i]);
}

/**
 * @file demo5.ino
 * @brief Function to copy a tcb struct from source to destination
 * 
 * This function copies the contents of a tcb struct from the source to the destination.
 * 
 * @param dst A pointer to the destination tcb struct
 * @param src A pointer to the source tcb struct
 * @return void
 */
void copy_tcb(tcb * dst, tcb * src) {
  // copy the function pointer
  dst->fn_ptr = src->fn_ptr;
  // copy the name string
  strcpy(dst->name, src->name);
  // copy the task ID
  dst->id = src->id;
  // copy the number of times the task has run
  dst->nTimes = src->nTimes;
  // copy the task state
  dst->state = src->state;
  // copy the task time
  dst->time = src->time;
  // copy the task sleep time
  dst->timeSleep = src->timeSleep;
}

/**
 * @file demo5.ino
 * @brief Function to quit the current task and move it to the dead task array
 * 
 * This function finds a spot in the dead task array and copies the current task's tcb struct to that spot.
 * It then sets the state of both the current task and the copied task to DEAD and sets the function pointer of the current task to NULL.
 * 
 * @param None
 * @return void
 */
void task_self_quit() {
  // find a spot in the dead array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  // if there's no space, don't do anything
  if (i == NTASKS) return;

  // copy the current task's tcb struct to the dead task array
  copy_tcb(&(deadTasks[i]), &(taskArr[currTask]));
  deadTasks[i].state = DEAD;
  taskArr[currTask].state = DEAD;
  taskArr[currTask].fn_ptr = NULL;
}

/**
 * @file demo5.ino
 * @brief Function to start a task
 * 
 * This function starts a task by copying its tcb struct to an open slot in the taskArr array.
 * It sets the state of the copied task to READY and the state of the original task to DEAD.
 * 
 * @param task A pointer to the tcb struct of the task to start
 * @return void
 */
void task_start(tcb * task) {
  // if the task is NULL or not in the DEAD state, return
  if (task == NULL || task->state != DEAD) return;

  // find an open slot in the taskArr array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (taskArr[i].fn_ptr == NULL) break;
  }

  // if there's no space, return
  if (i == NTASKS) return;

  // copy the tcb struct of the task to the open slot in the taskArr array
  copy_tcb(&(taskArr[i]), task);
  taskArr[i].state = READY;
  task->state = DEAD;
  task->fn_ptr = NULL;
}

/**
 * @file demo5.ino
 * @brief Function to load a new task into the dead task array
 * 
 * This function loads a new task into the dead task array by finding the next open slot in the array and copying the task's tcb struct to that slot.
 * It sets the task's name, function pointer, ID, number of times run, sleep time, time, and state.
 * 
 * @param fn_ptr A pointer to the function to be executed by the task
 * @param name A pointer to the name of the task
 * @return void
 */
void task_load(void (*fn_ptr)(), const char * name) {
  // find the next open slot in the dead task array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  // if there's no space, don't do anything
  if (i == NTASKS) return;

  // load up a new task
  strcpy(deadTasks[i].name, name); // set the name of the task
  deadTasks[i].fn_ptr = fn_ptr; // set the function pointer of the task
  deadTasks[i].id = id; // set the ID of the task
  id++; // increment the ID counter
  deadTasks[i].nTimes = 0; // set the number of times run to 0
  deadTasks[i].timeSleep = 0; // set the sleep time to 0
  deadTasks[i].time = 0; // set the time to 0
  deadTasks[i].state = DEAD; // set the state to DEAD
}

/**
 * @file demo5.ino
 * @brief Function to put a task to sleep for a specified amount of time
 * 
 * This function sets the sleep time of the current task to the specified time and changes its state to SLEEPING.
 * 
 * @param t The amount of time to sleep for
 * @return void
 */
void sleep_474(long t) {
  // set the sleep time of the current task to t
  taskArr[currTask].timeSleep = t;
  // change the state of the current task to SLEEPING
  taskArr[currTask].state = SLEEPING;
  return;
}

/**
 * @file demo5.ino
 * @brief Function to synchronize the task scheduler
 * 
 * This function synchronizes the task scheduler by updating the remaining sleep time of sleeping tasks and waking up any sleeping tasks whose sleep time has elapsed.
 * 
 * @param None
 * @return void
 */
void schedule_sync() {
  // wait until sFlag is no longer PENDING
  while (sFlag == PENDING) {
    3 + 5; // do nothing
  }

  // iterate through all tasks in the taskArr array
  for (int i = 0; i < NTASKS; i++) {
    // update remaining sleep time for sleeping tasks
    if (taskArr[i].state == SLEEPING) {
      taskArr[i].timeSleep -= 2; // decrement sleep time by 2
      // wake up any sleeping tasks whose sleep time has elapsed
      if (taskArr[i].timeSleep < 2) {
        taskArr[i].timeSleep = 0; // reset sleep time to 0
        taskArr[i].state = READY; // change state from SLEEPING to READY
      }
    }

    taskArr[i].time += 2; // increment task time by 2
  }

  // reset sFlag to PENDING
  sFlag = PENDING;
  return;
}

/**
 * @file demo5.ino
 * @brief Task 2 function to play a melody and countdown timer
 * 
 * This function plays a melody and a countdown timer using the setOC4AFreq function and the sleep_474 function.
 * 
 * @param None
 * @return void
 */
void task2() {
  // Reset the melody and task time if reset2 flag is set
  if (reset2) {
    setOC4AFreq(0);
    taskArr[currTask].time = 0;
    reset2 = 0;
    return;
  }

  // Play the melody
  for (int i = 0; i < NMELODY; i++) {
    if ( taskArr[currTask].time >= ((unsigned long) i * PLAY_DURATION) &&
      taskArr[currTask].time < (((unsigned long) i + 1) * PLAY_DURATION) ) {
      setOC4AFreq(melody[i]);
      currFreq = melody[i];
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  // Stop playing for 4 seconds
  if (taskArr[currTask].time < PICKUP_TIME) {
    setOC4AFreq(0);
    currFreq = 0;

    sleep_474(PAUSE_DURATION);
    return;
  }

  // Start playing after 4 seconds
  for (int i = 0; i < NMELODY; i++) {
    if (taskArr[currTask].time >= (PICKUP_TIME + ((unsigned long) i) * PLAY_DURATION) &&
        taskArr[currTask].time < (PICKUP_TIME + ((unsigned long) i + 1) * PLAY_DURATION)) {
      setOC4AFreq(melody[i]);
      currFreq = melody[i];
      sleep_474(PLAY_DURATION);
      return;
    }
  }

  // Play the countdown timer after the second melody
  if (taskArr[currTask].time >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION) &&
      taskArr[currTask].time < (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION + PAUSE_DURATION)) {
    task_start(find_dead_task("countdown"));
    sleep_474(PAUSE_DURATION);
    return;
  }

  // Reset the time and loop
  if (taskArr[currTask].time >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION + PAUSE_DURATION)) {
    currFreq = 0;
    taskArr[currTask].time = 0;
    return;
  }
}

/**
 * @file demo5.ino
 * @brief Task 4 function to play two melodies and a countdown timer
 * 
 * This function plays two melodies and a countdown timer using the setOC4AFreq function and the sleep_474 function.
 * 
 * @param None
 * @return void
 */
void task4() {
  // launch task 2 to run on the first call to task4
  if (taskArr[currTask].nTimes == 0) {
    task_load(task2, "task2");
    task_start(find_dead_task("task2"));
    task_load(task4_1, "display_freqs");
    task_load(task4_2, "countdown");
  }

  // Play the first melody and display the frequency on the 7-segment display
  if (taskArr[currTask].time < NMELODY * PLAY_DURATION) {
    task_start(find_dead_task("display_freqs"));
    sleep_474(NMELODY * PLAY_DURATION);
    return;
  }

  // Start the countdown task after the first melody
  if (taskArr[currTask].time >= NMELODY * PLAY_DURATION &&
      taskArr[currTask].time < (PLAY_DURATION*NMELODY) + PAUSE_DURATION) {
    task_start(find_dead_task("countdown"));
    sleep_474(PAUSE_DURATION);
    return;
  }

  // Play the second melody and display the frequency on the 7-segment display
  if (taskArr[currTask].time >= NMELODY * PLAY_DURATION + PAUSE_DURATION &&
      taskArr[currTask].time < 2 * NMELODY * PLAY_DURATION + PAUSE_DURATION) {
    task_start(find_dead_task("display_freqs"));
    sleep_474(NMELODY * PLAY_DURATION);
    return;
  }

  // Start the countdown task after the second melody
  if (taskArr[currTask].time >= 2 * NMELODY * PLAY_DURATION + PAUSE_DURATION &&
      taskArr[currTask].time < 2 * NMELODY * PLAY_DURATION + 2 * PAUSE_DURATION) {
    setOC4AFreq(0);
    currFreq = 0;
    task_start(find_dead_task("countdown"));
    sleep_474(PAUSE_DURATION);
    return;
  }

  // Reset the time and loop
  if (taskArr[currTask].time >= (2 * NMELODY * PLAY_DURATION) + (2 * PAUSE_DURATION)) {
    taskArr[currTask].time = 0;
  }
}
/**
 * @file demo5.ino
 * @brief Task 4 function to display the frequency on the 7-segment display
 * 
 * This function displays the frequency on the 7-segment display using the convert function, the seven_seg_digits array, 
 * the send7 function, and the sleep_474 function.
 * 
 * @param None
 * @return void
 */
void task4_1() {
  static int time; // static variable to keep track of time
  static int digits[4]; // static array to store digits
  static int displayStates[4] = {S0, S1, S2, S3}; // static array to store display states

  // take digits out of currFreq
  convert(digits, currFreq); // convert the current frequency to digits

  // display count on the 7seg display
  for (int h = 0; h < 5; h++) { // loop through the 7-segment display
    for (int i = 0; i < 4; i++) {
      int pin = 10 + i; // set the pin number
      if ((taskArr[currTask].time / 5) >= (4 * h) + i && (taskArr[currTask].time / 5) < (4 * h) + (i + 1)) {
        // turn 7seg & specified digit on
        PORTB = displayStates[i]; // set the display state
        byte *disp = seven_seg_digits[digits[i]]; // get the digit to display
        send7(disp); // send the digit to the 7-segment display
        sleep_474(2); // sleep for 2ms
        return; // exit the function
      }
    }
  }

  // reset
  if (taskArr[currTask].time >= 100) { // if the time is greater than or equal to 100ms
    time += taskArr[currTask].time; // add the current time to the total time
    taskArr[currTask].time = 0; // reset the task time
  }
  if (time >= NMELODY * PLAY_DURATION) { // if the total time is greater than or equal to the duration of the melody
    time = 0; // reset the total time
    PORTB = 0xFF; // turn off the 7-segment display
    task_self_quit(); // quit the task
  }
}

/**
 * @file demo5.ino
 * @brief Task 4 function to display a countdown timer on the 7-segment display
 * 
 * This function displays a countdown timer on the 7-segment display using the convert function, the seven_seg_digits array, 
 * the send7 function, and the sleep_474 function.
 * 
 * @param None
 * @return void
 */
void task4_2() {
  static long time; // static variable to keep track of time
  static int count; // static variable to keep track of count
  static int digits[4]; // static array to store digits
  static int displayStates[4] = {S0, S1, S2, S3}; // static array to store display states

  // take digits out of count
  convert(digits, (PAUSE_DURATION / 100) - count); // convert the count to digits

  // display count on the 7seg display
  for (int h = 0; h < 5; h++) { // loop through the 7-segment display
    for (int i = 0; i < 4; i++) {
      int pin = 10 + i; // set the pin number
      if ((taskArr[currTask].time / 5) >= (4 * h) + i && (taskArr[currTask].time / 5) < (4 * h) + (i + 1)) {
        // turn 7seg & specified digit on
        PORTB = displayStates[i]; // set the display state
        byte *disp = seven_seg_digits[digits[i]]; // get the digit to display
        send7(disp); // send the digit to the 7-segment display
        sleep_474(2); // sleep for 2ms
        return; // exit the function
      }
    }
  }

  // reset
  if (taskArr[currTask].time >= 100) { // if the time is greater than or equal to 100ms
    time += taskArr[currTask].time; // add the current time to the total time
    taskArr[currTask].time = 0; // reset the task time
    count = count == 9999 ? 0 : count + 1; // increment the count or reset it if it reaches 9999
  }

  if (time >= PAUSE_DURATION) { // if the total time is greater than or equal to the pause duration
    PORTB = 0xFF; // turn off the 7-segment display
    time = 0; // reset the total time
    taskArr[currTask].time = 0; // reset the task time
    count = 0; // reset the count
    task_self_quit(); // quit the task
  }
}



/**
 * @file demo5.ino
 * @brief Function to set up the interrupt for the timer
 * 
 * This function sets up the interrupt for the timer to work in CTC mode and enables the interrupt on counter A.
 * 
 * @param None
 * @return void
 */
void interruptSetup() {
  // reset settings
  TCCR3A = 0;
  TCCR3B = 0;

  // set timer to work in CTC mode
  TCCR3A |= (0 << WGM31) | (0 << WGM30);
  TCCR3B |= (0 << WGM33) | (1 << WGM32);
  TCCR3A |= (0 << COM3A1) | (1 << COM3A0);

  // enable interrupt on counter A
  TIMSK3 |= (1 << OCIE3A);

  // set frequency of timer
  TCCR3B |= (0 << CS32) | (0 << CS31) | (1 << CS30);
  // TCCR3B |= (1 << CS32) | (0 << CS31) | (1 << CS30); // 1024
  // OCR3A =  7812; // should make around 1 hz
  OCR3A = 32000;
  TCNT3H = 0;

  // enable interrupts
  SREG |= (1<<7);
}

/**
 * @file demo5.ino
 * @brief Sets the OCR4A to make the clock cycle frequency the same as the input freq
 * 
 * This function sets the OCR4A to make the clock cycle frequency the same as the input freq.
 * It calculates the prescaler value based on the input frequency and sets the timer counter to 0.
 * 
 * @param freq The frequency to set the OCR4A to
 * @return void
 */
void setOC4AFreq(uint32_t freq) {
  // Calculate the prescaler value based on the input frequency
  PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
  
  // Set the timer counter to 0
  TIMER_COUNTER = 0;
}


/**
 * @file demo5.ino
 * @brief Function to set up the speaker for playing sound
 * 
 * This function sets up the speaker for playing sound by configuring the timer registers and the prescaler value.
 * 
 * @param None
 * @return void
 */
void speakerSetup() {
  // reset timer registers
  TIMER_REG_A = 0;
  TIMER_REG_B = 0;

  // set timer to work in Fast PWM mode
  TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
  TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);

  // set output compare mode to toggle on match
  TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);

  // disable all interrupts
  TIMSK4 = 0;

  // set prescaler value to 1
  TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
  PRESCALER = 0;
  TIMER_COUNTER = 0;

  // set speaker pin as output
  SPEAKER_DDR |= BIT3;
}

/**
 * @file demo5.ino
 * @brief Function to set up the display and send data to the 7-segment display
 * 
 * This function sets up the digit selectors and 7-segment outputs for the display.
 * It also sends data to the 7-segment display by converting an array of bytes to an integer and setting the PORTA register to that value.
 * 
 * @param arr The array of bytes to send to the 7-segment display
 * @return void
 */
void send7(byte arr[7]) {
  int data = 0;
  for (int i = 0; i < 7; i++) {
    data |= (arr[i] << i); // shift the bits of arr[i] to the left by i and OR them with data
  }
  PORTA = data; // set the PORTA register to the value of data
}

/**
 * @file demo5.ino
 * @brief Function to set up the display
 * 
 * This function sets up the digit selectors and 7-segment outputs for the display.
 * 
 * @param None
 * @return void
 */
void displaySetup() {
  // set up digit selectors
  DDRB |= BIT7 | BIT6 | BIT5 | BIT4;

  // set up 7-seg outputs
  DDRA |= BIT7 | BIT6 | BIT5 | BIT4 | BIT3 | BIT2 | BIT1 | BIT0;

  PORTB |= BIT7 | BIT6 | BIT5 | BIT4; // set the PORTB register to enable the digit selectors
}


/**
 * @file demo5.ino
 * @brief Function to convert an integer to an array of its digits
 * 
 * This function takes an integer value and converts it to an array of its digits.
 * 
 * @param digits An array to store the digits of the integer
 * @param val The integer value to convert to an array of digits
 * @return void
 */
void convert(int * digits, int val) {
  digits[0] = val % 10; // get the last digit of the integer
  digits[1] = (val/10) % 10; // get the second to last digit of the integer
  digits[2] = (val/100) % 10; // get the third to last digit of the integer
  digits[3] = (val/1000) % 10; // get the fourth to last digit of the integer
}


/**
 * @file demo5.ino
 * @brief Function to set up the DDS task array
 * 
 * This function initializes the DDS task array by setting all of its elements to default values.
 * 
 * @param None
 * @return void
 */
void DDSSetup() {
  // populate task array
  for (int i = 0; i < NTASKS; i++) {
    taskArr[i].fn_ptr = NULL; // set function pointer to NULL
    taskArr[i].id = 0; // set task ID to 0
    taskArr[i].nTimes = 0; // set number of times to run task to 0
    taskArr[i].timeSleep = 0; // set time to sleep between task runs to 0
    taskArr[i].time = 0; // set time of last run to 0
    taskArr[i].state = DEAD; // set task state to DEAD
    deadTasks[i].fn_ptr = NULL; // set function pointer of dead task to NULL
    deadTasks[i].id = 0; // set ID of dead task to 0
    deadTasks[i].nTimes = 0; // set number of times to run dead task to 0
    deadTasks[i].timeSleep = 0; // set time to sleep between dead task runs to 0
    deadTasks[i].time = 0; // set time of last run of dead task to 0
    deadTasks[i].state = DEAD; // set state of dead task to DEAD
  }
}


    /**
 * @file demo6.ino
 * @brief This file contains the code for a scheduler loop that runs multiple tasks on an Arduino board. 
 * The authors of this file are Mason Wheeler and Joey Pirich.
 */

#include "DDS.h"

int reset1 = 0;
int reset2 = 0;

tcb taskArr[NTASKS];
tcb deadTasks[NTASKS];
volatile int id;
volatile int currTask;
volatile FLAG sFlag;

/// Initializes everything
void setup() {
  id = 0;
  /// Initalize outputs
  interruptSetup();
  speakerSetup();
  displaySetup();
  ledSetup();

  /// intialize our task tracking arrays
  DDSSetup();

  task_load(task5, "task5");
  task_load(schedule_sync, "schedule_sync");
  task_start(find_dead_task("task5"));
  task_start(find_dead_task("schedule_sync"));
}

/// Scheduler Loop
void loop() {
  for (int i = 0; i < NTASKS; i++) {
    if (taskArr[i].fn_ptr != NULL && taskArr[i].state == READY) {
      // start up this task
      taskArr[i].state = RUNNING;
      currTask = i;
      (*(taskArr[i].fn_ptr))();
      taskArr[i].nTimes++;

      // tear down
      if (taskArr[i].state == RUNNING) taskArr[i].state = READY;
    }
  }
}

/**
 * @brief Timer 3 Interrupt Service Routine (ISR)
 * 
 * This ISR sets the sFlag to DONE when the Timer 3 Compare Match A (COMPA) 
 * interrupt is triggered.
 * 
 * @param none
 * @return none
 */
ISR(TIMER3_COMPA_vect) {
  sFlag = DONE; // set the sFlag to DONE
}

/**
 * @brief Finds a dead task by name
 * 
 * This function searches the deadTasks array for a task with the given name.
 * If found, it returns a pointer to the corresponding tcb struct. If not found,
 * it returns NULL.
 * 
 * @param name The name of the task to find
 * @return A pointer to the corresponding tcb struct, or NULL if not found
 */
tcb * find_dead_task(const char * name) {
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (strcmp(name, deadTasks[i].name) == 0) break; // if the name matches, break out of the loop
  }

  if (i == NTASKS) return NULL; // if we reached the end of the array, the task was not found

  return &(deadTasks[i]); // return a pointer to the corresponding tcb struct
}


/**
 * @brief Copies the contents of one tcb struct to another
 * 
 * This function copies the contents of one tcb struct to another.
 * 
 * @param dst A pointer to the destination tcb struct
 * @param src A pointer to the source tcb struct
 * @return none
 */
void copy_tcb(tcb * dst, tcb * src) {
  // Copy the function pointer
  dst->fn_ptr = src->fn_ptr;
  // Copy the name string
  strcpy(dst->name, src->name);
  // Copy the task ID
  dst->id = src->id;
  // Copy the number of times the task has run
  dst->nTimes = src->nTimes;
  // Copy the task state
  dst->state = src->state;
  // Copy the task time
  dst->time = src->time;
  // Copy the task sleep time
  dst->timeSleep = src->timeSleep;
}


/**
 * @brief Terminates the currently running task and moves it to the deadTasks array
 * 
 * This function finds an open spot in the deadTasks array and copies the contents
 * of the currently running task's tcb struct to that spot. It then sets the state
 * of both the current task and the copied task to DEAD and sets the function pointer
 * of the current task to NULL.
 * 
 * @param none
 * @return none
 */
void task_self_quit() {
  // find a spot in the dead array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  if (i == NTASKS) return; // if there's no space, don't do anything

  // copy the current task's tcb struct to the deadTasks array
  copy_tcb(&(deadTasks[i]), &(taskArr[currTask]));
  deadTasks[i].state = DEAD;
  taskArr[currTask].state = DEAD;
  taskArr[currTask].fn_ptr = NULL; // set the function pointer of the current task to NULL
}

/**
 * @brief Starts a task by copying its tcb struct to the taskArr array
 * 
 * This function starts a task by copying its tcb struct to the taskArr array.
 * It first checks if the task is NULL or if it is not in the DEAD state. If either
 * of these conditions are true, the function returns without doing anything. If the
 * task is valid, the function finds an open spot in the taskArr array and copies the
 * tcb struct to that spot. It then sets the state of the copied task to READY and the
 * state of the original task to DEAD. Finally, it sets the function pointer of the
 * original task to NULL.
 * 
 * @param task A pointer to the tcb struct of the task to start
 * @return none
 */
void task_start(tcb * task) {
  // if the task is NULL or not in the DEAD state, return without doing anything
  if (task == NULL || task->state != DEAD) return;

  // find a spot in the taskArr array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (taskArr[i].fn_ptr == NULL) break;
  }

  // if there's no space, return without doing anything
  if (i == NTASKS) return;

  // copy the tcb struct to the taskArr array
  copy_tcb(&(taskArr[i]), task);
  taskArr[i].state = READY;
  task->state = DEAD;
  task->fn_ptr = NULL;
}

/**
 * @brief Loads a new task into the deadTasks array
 * 
 * This function finds an open spot in the deadTasks array and loads a new task
 * into that spot. It sets the name, function pointer, ID, number of times run,
 * sleep time, time, and state of the new task.
 * 
 * @param fn_ptr A pointer to the function that the task will run
 * @param name A string containing the name of the task
 * @return none
 */
void task_load(void (*fn_ptr)(), const char * name) {
  // find the next open slot in the dead task array
  int i;
  for (i = 0; i < NTASKS; i++) {
    if (deadTasks[i].fn_ptr == NULL) break;
  }

  // if there's no space, don't do anything
  if (i == NTASKS) return;

  // load up a new task
  strcpy(deadTasks[i].name, name); // set the name of the new task
  deadTasks[i].fn_ptr = fn_ptr; // set the function pointer of the new task
  deadTasks[i].id = id; // set the ID of the new task
  id++; // increment the ID counter
  deadTasks[i].nTimes = 0; // set the number of times run to 0
  deadTasks[i].timeSleep = 0; // set the sleep time to 0
  deadTasks[i].time = 0; // set the time to 0
  deadTasks[i].state = DEAD; // set the state to DEAD
}

/**
 * @brief Puts the current task to sleep for a specified amount of time
 * 
 * This function sets the sleep time of the current task to the specified time t
 * and sets the state of the current task to SLEEPING.
 * 
 * @param t The amount of time to sleep for
 * @return none
 */
void sleep_474(long t) {
  // set the sleep time of the current task to t
  taskArr[currTask].timeSleep = t;
  // set the state of the current task to SLEEPING
  taskArr[currTask].state = SLEEPING;
  return;
}

/**
 * @brief Synchronizes the task scheduler
 * 
 * This function synchronizes the task scheduler by updating the remaining sleep time
 * of each sleeping task and waking up any tasks that have finished sleeping. It also
 * updates the time of each task and resets the sFlag.
 * 
 * @param none
 * @return none
 */
void schedule_sync() {
  // wait for sFlag to be set to PENDING
  while (sFlag == PENDING) {
    3 + 5; // do nothing
  }

  // update each task's remaining sleep time and wake up any sleeping tasks
  for (int i = 0; i < NTASKS; i++) {
    // update remaining sleep time
    if (taskArr[i].state == SLEEPING) {
      taskArr[i].timeSleep -= 2;
      // wake up any sleeping tasks
      if (taskArr[i].timeSleep < 2) {
        // reset to t = 0 in sleep array (not sure if needed)
        taskArr[i].timeSleep = 0;
        // change corresponding state from SLEEPING to READY
        taskArr[i].state = READY;
      }
    }

    // update time of each task
    taskArr[i].time += 2;
  }

  // reset sFlag
  sFlag = PENDING;
  return;
}


/**
 * @brief Task 1 function
 * 
 * This function is responsible for flashing an LED on pin 47 for a specified duration.
 * 
 * @param none
 * @return none
 */
void task1() {
  // reset everything given a reset signal
  if (reset1) {
    LED_PORT |= BIT2; // turn on LED
    taskArr[currTask].time = 0; // reset task time
    reset1 = 0; // reset reset1 flag
    return;
  }

  // flash led on pin 47 for FLASH_DURATION
  if (taskArr[currTask].time < (1 * FLASH_DURATION) + 1) {
    LED_PORT &= ~BIT2; // turn off LED
    sleep_474(250); // sleep for 250ms
    return;
  }

  if (taskArr[currTask].time < (2 * FLASH_DURATION) + 1) {
    LED_PORT |= BIT2; // turn on LED
    sleep_474(750); // sleep for 750ms
    return;
  }

  if (taskArr[currTask].time >= 1000) {
    taskArr[currTask].time = 0; // reset task time
  }

  return;
}

/**
 * @brief Task 2 function
 * 
 * This function is responsible for playing a melody using the setOC4AFreq function.
 * 
 * @param none
 * @return none
 */
void task2() {
  // reset everything given a reset signal
  if (reset2) {
    setOC4AFreq(0); // stop playing
    taskArr[currTask].time = 0; // reset task time
    reset2 = 0; // reset reset2 flag
    return;
  }

  // play tone
  for (int i = 0; i < NMELODY; i++) {
    if ( taskArr[currTask].time >= ((unsigned long) i * PLAY_DURATION) &&
      taskArr[currTask].time < (((unsigned long) i + 1) * PLAY_DURATION) ) {
      setOC4AFreq(melody[i]); // play melody
      sleep_474(PLAY_DURATION); // sleep for duration of melody
      return;
    }
  }

  // stop playing for 4 seconds
  if (taskArr[currTask].time < PICKUP_TIME) {
    setOC4AFreq(0); // stop playing
    sleep_474(PAUSE_DURATION); // sleep for pause duration
    return;
  }

  // start playing after 4 seconds
  for (int i = 0; i < NMELODY; i++) {
    if (taskArr[currTask].time >= (PICKUP_TIME + ((unsigned long) i) * PLAY_DURATION) &&
        taskArr[currTask].time < (PICKUP_TIME + ((unsigned long) i + 1) * PLAY_DURATION)) {
      setOC4AFreq(melody[i]); // play melody
      sleep_474(PLAY_DURATION); // sleep for duration of melody
      return;
    }
  }

  // reset
  if (taskArr[currTask].time >= (PICKUP_TIME + (unsigned long) NMELODY * PLAY_DURATION)) {
    taskArr[currTask].time = 0; // reset task time
    task_self_quit(); // quit task
  }
}

/**
 * @file demo6.ino
 * @brief Task 4_2 function
 * 
 * This function is responsible for displaying a countdown on a 7-segment display.
 * 
 * @param none
 * @return none
 */
void task4_2() {
  static long time; // static variable to keep track of time
  static int count; // static variable to keep track of count
  static int digits[4]; // static array to store digits of the count
  static int displayStates[4] = {S0, S1, S2, S3}; // static array to store display states of the 7-segment display

  // take digits out of count
  convert(digits, (PAUSE_DURATION_T5 / 100) - count); // convert count to digits and store in digits array

  // display count on the 7seg display
  for (int h = 0; h < 5; h++) { // loop through each digit of the count
    for (int i = 0; i < 4; i++) { // loop through each 7-segment display digit
      if ((taskArr[currTask].time / 5) >= (4 * h) + i && (taskArr[currTask].time / 5) < (4 * h) + (i + 1)) {
        // turn 7seg & specified digit on
        PORTB = displayStates[i]; // set the display state of the 7-segment display
        byte *disp = seven_seg_digits[digits[i]]; // get the byte array for the digit to be displayed
        send7(disp); // display the digit on the 7-segment display
        sleep_474(2); // sleep for 2ms
        return; // return to main loop
      }
    }
  }

  // reset
  if (taskArr[currTask].time >= 100) { // if the time has reached 100ms
    time += taskArr[currTask].time; // add the current task time to the total time
    taskArr[currTask].time = 0; // reset the task time
    count = count == 9999 ? 0 : count + 1; // increment the count or reset it if it has reached 9999
  }

  if (time >= PAUSE_DURATION_T5) { // if the total time has reached the pause duration
    PORTB = 0xFF; // turn off the 7-segment display
    time = 0; // reset the total time
    taskArr[currTask].time = 0; // reset the task time
    count = 0; // reset the count
    task_self_quit(); // quit the task
  }
}


/**
 * @file demo6.ino
 * @brief Task 5 function
 * 
 * This function is responsible for coordinating the execution of multiple tasks.
 * 
 * @param none
 * @return none
 */
void task5() {
  Serial.begin(9600); // initialize serial communication

  // load tasks if this is the first time running the function
  if (taskArr[currTask].nTimes == 0) {
    task_load(task1, "task1"); // load task1
    task_start(find_dead_task("task1")); // start task1
    task_load(task2, "task2"); // load task2
    task_load(task4_2, "countdown"); // load countdown task
    task_load(task5_1, "smile"); // load smile task
  }
  
  // execute task2 for TASK2_DURATION
  if (taskArr[currTask].time < TASK2_DURATION) {
    task_start(find_dead_task("task2")); // start task2
    sleep_474(TASK2_DURATION); // sleep for TASK2_DURATION
    return; // return to main loop
  }

  // execute countdown task for PAUSE_DURATION_T5
  if (taskArr[currTask].time >= TASK2_DURATION &&
      taskArr[currTask].time < (TASK2_DURATION + PAUSE_DURATION_T5)) {
    task_start(find_dead_task("countdown")); // start countdown task
    setOC4AFreq(0); // stop playing melody
    sleep_474(PAUSE_DURATION_T5); // sleep for PAUSE_DURATION_T5
    return; // return to main loop
  }

  // execute task2 for TASK2_DURATION
  if (taskArr[currTask].time >= (TASK2_DURATION + PAUSE_DURATION_T5) &&
      taskArr[currTask].time < ((2 * (TASK2_DURATION)) + PAUSE_DURATION_T5)) {
    task_start(find_dead_task("task2")); // start task2
    sleep_474(TASK2_DURATION); // sleep for TASK2_DURATION
    return; // return to main loop
  }

  // execute smile task for SMILE_DURATION
  if (taskArr[currTask].time >= ((2 * (TASK2_DURATION) + PAUSE_DURATION_T5)) &&
      taskArr[currTask].time < ((2 * (TASK2_DURATION) + PAUSE_DURATION_T5 + SMILE_DURATION))) {
    setOC4AFreq(0); // stop playing melody
    task_start(find_dead_task("smile")); // start smile task
    sleep_474(SMILE_DURATION); // sleep for SMILE_DURATION
    return; // return to main loop
  }

  // quit task
  if (taskArr[currTask].time >= ((2 * (TASK2_DURATION) + PAUSE_DURATION_T5 + SMILE_DURATION))) {
    task_self_quit(); // quit task
    return; // return to main loop
  }
}

/**
 * @file demo6.ino
 * @brief Task 5.1 function for displaying count on 7-segment display and quitting task after SMILE_DURATION
 * 
 * This function is responsible for displaying the count on the 7-segment display and quitting the task after SMILE_DURATION.
 * 
 * @param none
 * @return none
 */
void task5_1() {
  static long time; // static variable to keep track of time
  static int displayStates[4] = {S0, S1, S2, S3}; // array of 7-segment display states

  // display count on the 7seg display
  for (int h = 0; h < 5; h++) { // loop through each digit of the count
    for (int i = 0; i < 4; i++) { // loop through each 7-segment display digit
      if ((taskArr[currTask].time / 5) >= (4 * h) + i && (taskArr[currTask].time / 5) < (4 * h) + (i + 1)) {
        // if the current count is within the range of the current 7-segment display digit
        // turn 7seg & specified digit on
        PORTB = displayStates[i]; // turn on the specified 7-segment display digit
        byte *disp = smile_seg[i]; // get the byte array for the specified digit
        send7(disp); // send the byte array to the 7-segment display
        sleep_474(2); // sleep for 2ms
        return; // return to main loop
      }
    }
  }

  // reset
  if (taskArr[currTask].time >= 100) { // if the current count has reached 100
    time += taskArr[currTask].time; // add the current time to the static time variable
    taskArr[currTask].time = 0; // reset the current count
  }
  if (time >= SMILE_DURATION) { // if the total time has reached SMILE_DURATION
    time = 0; // reset the total time
    PORTB = 0xFF; // turn off the 7-segment display
    task_self_quit(); // quit the task
  }
}

/**
 * @file demo6.ino
 * @brief Function for setting up the interrupt timer
 * 
 * This function sets up the interrupt timer to work in CTC mode and enables interrupts on counter A.
 * It also sets the frequency of the timer and enables interrupts.
 * 
 * @param none
 * @return none
 */
void interruptSetup() {
  // reset settings
  TCCR3A = 0;
  TCCR3B = 0;

  // set timer to work in CTC mode
  TCCR3A |= (0 << WGM31) | (0 << WGM30);
  TCCR3B |= (0 << WGM33) | (1 << WGM32);
  TCCR3A |= (0 << COM3A1) | (1 << COM3A0);

  // enable interrupt on counter A
  TIMSK3 |= (1 << OCIE3A);

  // set frequency of timer
  TCCR3B |= (0 << CS32) | (0 << CS31) | (1 << CS30);
  // TCCR3B |= (1 << CS32) | (0 << CS31) | (1 << CS30); // 1024
  // OCR3A =  7812; // should make around 1 hz
  OCR3A = 32000;
  TCNT3H = 0;

  // enable interrupts
  SREG |= (1<<7);
}

/**
 * @file demo6.ino
 * @brief Function for setting the OCR4A to make the clock cycle frequency the same as the input freq
 * 
 * This function sets the OCR4A to make the clock cycle frequency the same as the input freq.
 * 
 * @param freq The frequency to set the OCR4A to
 * @return none
 */
void setOC4AFreq(uint32_t freq) {
  // calculate the prescaler value based on the input frequency
  PRESCALER = freq == 0 ? 0 : 16000000 / (2 * freq);
  // reset the timer counter
  TIMER_COUNTER = 0;
}

/**
 * @file demo6.ino
 * @brief Function for setting up the speaker
 * 
 * This function sets up the speaker to work in fast PWM mode and enables interrupts on counter A.
 * It also sets the frequency of the speaker and enables interrupts.
 * 
 * @param none
 * @return none
 */
void speakerSetup() {
  // reset settings
  TIMER_REG_A = 0;
  TIMER_REG_B = 0;

  // set speaker to work in fast PWM mode
  TIMER_REG_A |= (0 << WGM41) | (0 << WGM40);
  TIMER_REG_B |= (0 << WGM43) | (1 << WGM42);

  // set speaker output to toggle on compare match
  TIMER_REG_A |= (0 << COM4A1) | (1 << COM4A0);

  // disable all interrupts
  TIMSK4 = 0;

  // set frequency of speaker
  TIMER_REG_B |= (0 << CS42) | (0 << CS41) | (1 << CS40);
  PRESCALER = 0;
  TIMER_COUNTER = 0;

  // set speaker pin as output
  SPEAKER_DDR |= BIT3;
}

/**
 * @file demo6.ino
 * @brief Functions for setting up and controlling the display
 */

// Set up the display
void displaySetup() {
  // Set up digit selectors
  DDRB |= BIT7 | BIT6 | BIT5 | BIT4;

  // Set up 7-segment outputs
  DDRA |= BIT7 | BIT6 | BIT5 | BIT4 | BIT3 | BIT2 | BIT1 | BIT0;

  // Turn on all digit selectors
  PORTB |= BIT7 | BIT6 | BIT5 | BIT4;
}

/**
 * @brief Sends an array of 7 bytes to the 7-segment display
 * 
 * This function takes an array of 7 bytes and sends them to the 7-segment display.
 * Each byte represents a segment of the display, with the least significant bit
 * representing segment A and the most significant bit representing segment G.
 * 
 * @param arr The array of 7 bytes to send to the display
 * @return none
 */
void send7(byte arr[7]) {
  int data = 0;

  // Convert the array of bytes to a single integer
  for (int i = 0; i < 7; i++) {
    data |= (arr[i] << i);
  }

  // Send the integer to the display
  PORTA = data;
}

/**
 * @file demo6.ino
 * @brief Function for converting an integer to an array of its digits
 * 
 * This function takes an integer value and converts it to an array of its digits.
 * The digits are stored in the input array in reverse order, with the least significant
 * digit in the first element and the most significant digit in the last element.
 * 
 * @param digits The array to store the digits in
 * @param val The integer value to convert to an array of digits
 * @return none
 */
void convert(int * digits, int val) {
  // Calculate each digit of the integer and store it in the input array
  digits[0] = val % 10; // least significant digit
  digits[1] = (val/10) % 10;
  digits[2] = (val/100) % 10;
  digits[3] = (val/1000) % 10; // most significant digit
}

/**
 * @file demo6.ino
 * @brief Functions for setting up and controlling the LED
 */

// Set up the LED
void ledSetup() {
  // Set output pin for task1
  LED_DDR |= BIT2; // Set bit 2 of LED_DDR to 1 to make it an output pin
}


/**
 * @file demo6.ino
 * @brief Functions for setting up and controlling the DDS (Dynamic Digital Signage) system
 */

/**
 * @brief Sets up the DDS system by initializing the task array and dead task array
 * 
 * This function initializes the task array and dead task array by setting all of their
 * elements to default values. Each element in the task array represents a task that can
 * be executed by the DDS system, while each element in the dead task array represents a
 * task that has been completed and is no longer active.
 * 
 * @param none
 * @return none
 */
void DDSSetup() {
  // populate task array
  for (int i = 0; i < NTASKS; i++) {
    // set all elements of task array to default values
    taskArr[i].fn_ptr = NULL;
    taskArr[i].id = 0;
    taskArr[i].nTimes = 0;
    taskArr[i].timeSleep = 0;
    taskArr[i].time = 0;
    taskArr[i].state = DEAD;

    // set all elements of dead task array to default values
    deadTasks[i].fn_ptr = NULL;
    deadTasks[i].id = 0;
    deadTasks[i].nTimes = 0;
    deadTasks[i].timeSleep = 0;
    deadTasks[i].time = 0;
    deadTasks[i].state = DEAD;
  }
}
`

</script>

<pre>
    <code>
        {@html code}
    </code>
</pre>


