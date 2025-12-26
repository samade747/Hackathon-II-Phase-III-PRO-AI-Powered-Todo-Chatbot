"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";

export default function VoiceControl({ onTranscript }: { onTranscript: (t: string) => void }) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const Win = window as any;
            const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;
                recognitionRef.current.lang = "en-US"; // Default, bot can detect Urdu in backend

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    onTranscript(transcript);
                };

                recognitionRef.current.onend = () => {
                    setIsListening(false);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };
            }
        }
    }, [onTranscript]);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        try {
            if (isListening) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
                setIsListening(true);
            }
        } catch (error) {
            console.error("Speech recognition toggle error:", error);
            setIsListening(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            className={cn(
                "px-6 py-4 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                isListening
                    ? "bg-rose-500 text-white shadow-rose-500/20 animate-pulse"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
            )}
            title={isListening ? "Stop Listening" : "Start Voice Command"}
        >
            {isListening ? (
                <div className="flex gap-1">
                    <motion.span
                        animate={{ height: [8, 16, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="w-1 bg-white rounded-full"
                    />
                    <motion.span
                        animate={{ height: [12, 8, 12] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
                        className="w-1 bg-white rounded-full"
                    />
                    <motion.span
                        animate={{ height: [8, 16, 8] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }}
                        className="w-1 bg-white rounded-full"
                    />
                </div>
            ) : (
                <Mic size={20} />
            )}
        </motion.button>
    );
}

const cn = (...inputs: any[]) => {
    return inputs.filter(Boolean).join(" ");
};
