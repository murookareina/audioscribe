# AudioScribe
Tired of taking notes? Hands cramping during lectures?
AudioScribe to the rescue!

## About
After coming out of violin lessons, I felt like I was missing what my teachers said while I was playing for them. It inspired me to create AudioScribe, a React Native app that uses Expo & Expo's Audio API to record audio. Once recorded, Google's Speech-To-Text API picks up on any speech and transcribes it into text.

I initially ran into some problems as I'd wanted to use IBM Watson's Speech-To-Text API but realized I was having a hard time persisting to a server. Google Cloud Functions then helped me solve my server issue by becoming the middle man between the API and client side.
