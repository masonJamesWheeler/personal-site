<script>
let text = `Lab 2: Melodies and LED’s, but it's not a Rave.
Mason Wheeler, 2032634
Joseph Pirich, 2042211 12-Apr-2023
Assignment: ECE474 Lab 2
Abstract
This lab report presents the implementation and results of driving digital outputs to display the
location of a thumbstick toggle to a 8x8 LED matrix as well as produce a tone on a speaker
using an Arduino Mega microcontroller board. The project aimed to enhance our understanding
of low-level hardware manipulation, specifically controlling hardware registers/bits without
relying on existing libraries, and coordinating multiple concurrent tasks through round-robin
scheduling. We successfully implemented a LED flashing sequence, generated a specific tone
sequence on a speaker, and created an interactive XY LED display matrix that responded to
thumbstick inputs. The project showcased our ability to manage multiple tasks concurrently and
demonstrated their proficiency in manipulating hardware registers/bits directly.
1. Introduction
Working as a team we took on the challenge of controlling an 8x8 LED matrix and producing a
tone on a speaker using an Arduino Mega microcontroller board. The main goal of this project
was to help us better understand low-level hardware manipulation, programming, and managing
multiple tasks at once.
For this project, we were required to create three different functions: (1) a flashing LED
sequence with 3 LED’s using bit operations. (2) a specific tone sequence representing Mary had
a Little Lamb using a square tone played on a speaker, and (3) an interactive XY LED display
matrix that reacted to thumbstick inputs. To add to the challenge, we weren't allowed to use
pre-built libraries and had to manipulate the hardware registers and bits directly.
In this report, we'll discuss the basic knowledge we needed to understand before starting the
project, the steps we took to achieve the objectives, the technical aspects and challenges we
encountered, and the results we obtained. This project was an excellent opportunity for us to
apply what we've learned in class to a real-world situation, helping our team grow our skills and
understanding of microcontrollers.
2. Methods and Techniques:
In this lab report, we used Arduino programming, LED control, and speaker control to develop a
system that can both light up a sequence of three LEDs and play the "Mary Had a Little Lamb"
tune. We took advantage of the millis() function to manage multiple tasks concurrently, allowing
the LEDs and speaker to work at the same time without interrupting each other.
1
Wheeler CSE 474
For controlling the speaker, we applied pulse-width modulation (PWM) to create different
frequencies corresponding to the musical notes of the song. This technique allowed us to
generate the desired melody accurately.
Furthermore, we expanded the project by integrating an LED matrix and a thumbstick, which
together formed an interactive visual display. The thumbstick inputs were used to manipulate the
LED matrix, providing an engaging and dynamic experience for the user. Throughout the
development process, we ensured that the added components did not interfere with the ongoing
operation of the LED sequence and speaker functionality.
3. Procedures and Results
1.2:
Procedure:
In this part, we implemented code to control three LEDs connected to pins 47, 48, and 49 on an
Arduino board.
1. We start by defining three constants to represent the LED pins: ledPin1, ledPin2, and
ledPin3. They are assigned the values 47, 48, and 49 respectively.
2. In the setup() function, we set the pinMode for each LED pin to OUTPUT using
pinMode(). This configures the pins to be used as output pins to control the LEDs.
3. In the loop() function, we use digitalWrite() to turn each LED on and off sequentially. We
turn on an LED by setting its corresponding pin to HIGH and turn it off by setting the pin
to LOW.
4. We introduce a delay of 333 milliseconds between turning on and off each LED using the
delay() function. This creates a pattern where each LED is lit for 333 milliseconds before
moving on to the next one.
Results:
When the code is uploaded to the Arduino, the LEDs connected to pins 47, 48, and 49 light up
sequentially for 333 milliseconds each. After the last LED turns off, the cycle repeats.
1.4:
Procedure:
In this part, we implemented a similar LED control pattern as in 1.2, but using lower-level
programming with direct port manipulation.
1. In the setup() function, we set pins 47, 48, and 49 as output pins by manipulating the
DDR (Data Direction Register) for port L. We use the bitwise OR operator (|=) to set the
corresponding bits for the LED pins without affecting other pins.
2. In the loop() function, we use the PORT register for port L to control the LEDs. We turn
an LED on by setting its corresponding bit using the bitwise OR operator (|=) and turn it
off by clearing the bit using the bitwise AND operator (&=) with the bitwise NOT operator
(~).
2
Wheeler CSE 474
3. We introduce a delay of 333 milliseconds between turning on and off each LED using the
delay() function, as in the previous example.
Results:
When the code is uploaded to the Arduino, the LEDs connected to pins 47, 48, and 49 light up
sequentially for 333 milliseconds each, just like in the previous example. However, the code in
this part uses direct port manipulation, which provides faster and more efficient control of the
pins.
Procedure for Task 3.2:
1. Modify the provided code for Task A and Task B to run concurrently, while maintaining
the same functionality for each individual task.
2. Add global variables to track the completion status of Task A and Task B.
3. Implement a state machine in the controlTasks() function to manage the execution of
both tasks in different phases.
4. Modify the runTaskA() and runTaskB() functions to run only when enabled by the
controlTasks() function.
5. Test the modified code to ensure that Task A and Task B run concurrently, and the
desired functionality is achieved.
Results for Task 3.2:
The modified code successfully demonstrated the simultaneous operation of Task A and Task B.
The controlTasks() function managed the different phases of execution and enabled the tasks
accordingly. The LED sequence (Task A) and the melody (Task B) were both performed
concurrently as expected.
Procedure for Task 4:
1. Modify the given code to include a thumbstick-controlled LED matrix as an interactive
display.
2. Add global variables and function prototypes to handle the LED matrix and thumbstick
inputs.
3. Implement the spiTransfer() function to transfer data to the LED matrix.
4. Implement the convertToIndex() function to convert the thumbstick value to a row or
column index for the LED matrix.
5. Modify the loop() function to include reading the thumbstick inputs and controlling the
LED matrix based on the inputs.
6. Test the modified code to ensure that the interactive display works as expected, in
addition to the simultaneous operation of Task A and Task B.
Results for Task 4:
The modified code successfully integrated a thumbstick-controlled LED matrix as an interactive
display. The thumbstick inputs were accurately translated to row and column indices for the LED
matrix, and the display responded accordingly. The LED matrix functionality did not interfere
with the concurrent operation of Task A and Task B.
4. Code Documentation:
3
Wheeler CSE 474
The provided code is designed to set up and manage three LEDs, a speaker, and an LED
matrix connected to a thumbstick. The core functionality of the code is split into two distinct
tasks, referred to as Task A and Task B. Task A is responsible for managing the sequential
illumination of the LEDs, while Task B takes charge of playing the "Mary Had a Little Lamb" tune
using the speaker.
The controlTasks() function plays a crucial role in overseeing the progression of both tasks
through their respective phases, ensuring smooth transitions and proper execution. Meanwhile,
the LED matrix and the attached thumbstick are managed within the main loop of the code. This
arrangement allows for continuous input from the thumbstick, which in turn manipulates the LED
matrix display.
Additionally, the code includes a conversion function that effectively maps the thumbstick
readings to row and column indices on the LED matrix. This mapping enables the user to
interact with the visual display, providing an engaging and dynamic experience while
maintaining the functionality of the LED sequence and the speaker.
5. Overall Performance Summary:
The code performs well in achieving the desired outcome: sequentially lighting up the LEDs and
playing the "Mary Had a Little Lamb" tune. The LEDs operate smoothly and transition without
any noticeable delay. The speaker plays the tune with the correct note durations and maintains
the melody throughout the sequence. The LED matrix and thumbstick provide a responsive and
engaging visual display, with no noticeable lag or inaccuracies.
6. Teamwork Breakdown:
We worked together as a team, dividing the tasks among ourselves and regularly
communicating our progress. We collaboratively designed the overall structure of the code and
then split the implementation of Task A, Task B, and the LED matrix/thumbstick control. Each
team member contributed to debugging and refining the code, ensuring a smooth integration of
all components.
7. Discussion:
Our project showcases the ability to control multiple hardware components simultaneously using
Arduino programming. The integration of millis() allowed us to manage concurrent tasks without
resorting to delay(), enabling the parallel operation of LEDs and the speaker. The use of an LED
matrix and thumbstick added an interactive aspect to the project, enhancing its appeal and
engagement.
8. Conclusion:
In conclusion, our team effectively designed and implemented a system that controls three
LEDs and a speaker, playing a tune while also offering an interactive visual display. Through
collaboration and clear communication, we successfully met our project goals and developed an
engaging final product.
This project helped us enhance our skills in Arduino programming and showed us the potential
of this technology for creative and interactive applications. We are excited about our
4
Wheeler CSE 474
accomplishments and eager to explore further possibilities in the future, applying the knowledge
and experience we gained from this project to new challenges and endeavors.`
</script>

<pre>
    <code>
        {text}
    </code>
</pre>