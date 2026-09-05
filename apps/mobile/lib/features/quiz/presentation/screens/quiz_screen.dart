import 'package:flutter/material.dart';

class QuizScreen extends StatefulWidget {
  final String competitionId;
  final VoidCallback onSubmitComplete;

  const QuizScreen({
    Key? key,
    required this.competitionId,
    required this.onSubmitComplete,
  }) : super(key: key);

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _currentIndex = 0;
  final Map<int, String> _selectedAnswers = {};

  final List<Map<String, dynamic>> _sampleQuestions = [
    {
      "id": "q1",
      "text": "Which programming language is predominantly used for Flutter cross-platform development?",
      "options": [
        {"key": "A", "text": "Java"},
        {"key": "B", "text": "Dart"},
        {"key": "C", "text": "Swift"},
        {"key": "D", "text": "Kotlin"}
      ]
    },
    {
      "id": "q2",
      "text": "Which Indian city is known as the Silicon Valley of India?",
      "options": [
        {"key": "A", "text": "Mumbai"},
        {"key": "B", "text": "Bengaluru"},
        {"key": "C", "text": "Hyderabad"},
        {"key": "D", "text": "Gurugram"}
      ]
    }
  ];

  void _submitQuiz() {
    // In production, posts payload to /api/v1/attempts/:id/submit with X-Idempotency-Key
    widget.onSubmitComplete();
  }

  @override
  Widget build(BuildContext context) {
    final currentQ = _sampleQuestions[_currentIndex];
    final options = currentQ["options"] as List;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(
          "Question ${_currentIndex + 1} of ${_sampleQuestions.length}",
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
        ),
        actions: const [
          Center(
            child: Padding(
              padding: EdgeInsets.only(right: 16.0),
              child: Text(
                "⏱ 01:54",
                style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Linear Progress Indicator
            LinearProgressIndicator(
              value: (_currentIndex + 1) / _sampleQuestions.length,
              backgroundColor: const Color(0xFF1E293B),
              color: const Color(0xFF38BDF8),
            ),
            const SizedBox(height: 32),

            // Question Text Card
            Text(
              currentQ["text"],
              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, height: 1.4),
            ),
            const SizedBox(height: 32),

            // Options List
            ...options.map((opt) {
              final String key = opt["key"];
              final String text = opt["text"];
              final bool isSelected = _selectedAnswers[_currentIndex] == key;

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedAnswers[_currentIndex] = key;
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF38BDF8).withOpacity(0.2) : const Color(0xFF1E293B),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF38BDF8) : const Color(0xFF334155),
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isSelected ? const Color(0xFF38BDF8) : const Color(0xFF334155),
                        ),
                        child: Center(
                          child: Text(
                            key,
                            style: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          text,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),

            const Spacer(),

            // Navigation Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentIndex > 0)
                  TextButton(
                    onPressed: () => setState(() => _currentIndex--),
                    child: const Text("Previous", style: TextStyle(color: Color(0xFF94A3B8))),
                  )
                else
                  const SizedBox(),
                ElevatedButton(
                  onPressed: () {
                    if (_currentIndex < _sampleQuestions.length - 1) {
                      setState(() => _currentIndex++);
                    } else {
                      _submitQuiz();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text(
                    _currentIndex == _sampleQuestions.length - 1 ? "SUBMIT QUIZ" : "NEXT QUESTION",
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
