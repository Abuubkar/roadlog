# Assessment brief

Original materials supplied with the **Full Stack Developer** assessment, kept here for reference.

| File | What it is |
| --- | --- |
| [`assessment-instructions.docx`](assessment-instructions.docx) | The original instructions document |
| [`fmcsa-drivers-guide-to-hos-2022.pdf`](fmcsa-drivers-guide-to-hos-2022.pdf) | FMCSA *Interstate Truck Driver's Guide to Hours of Service* (2022) |
| [`fmcsa-guide-highlights.png`](fmcsa-guide-highlights.png) | Table of contents with the sections that matter highlighted |
| [`blank-paper-log.png`](blank-paper-log.png) | Blank paper *Drivers Daily Log*, the reference for the generated sheets |
| [`video-transcript.md`](video-transcript.md) | Transcript of the reference video on filling out a paper log |

## Instructions (transcribed)

Build a full-stack app using **Django** and **React**.

**Deliverables**

- A live hosted version
- A 3–5 minute Loom walking through the app and the code
- The GitHub code

We will test the hosted version for accuracy, and the accuracy must be up to standard. UI and UX must be good: pay attention to design and aesthetics, which can make up for some inaccuracies in output.

### Objective

Build an app that takes trip details as inputs and outputs route instructions and draws ELD logs.

**Inputs**

- Current location
- Pickup location
- Drop-off location
- Current cycle used (hrs)

**Outputs**

- A map showing the route, with information about stops and rests (use a free map API)
- Filled-out daily log sheets: draw on the log and fill out the sheet. Longer trips need multiple log sheets.

**Assumptions**

- Property-carrying driver, 70 hrs / 8 days, no adverse driving conditions
- Fueling at least once every 1,000 miles
- 1 hour each for pickup and drop-off
