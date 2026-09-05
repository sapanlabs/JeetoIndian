import 'package:flutter/material.dart';

import 'features/auth/presentation/screens/otp_login_screen.dart';
import 'features/home/presentation/screens/home_screen.dart';
import 'features/quiz/presentation/screens/quiz_screen.dart';
import 'features/result/presentation/screens/result_screen.dart';
import 'features/leaderboard/presentation/screens/leaderboard_screen.dart';

void main() {
  runApp(const JeetoIndianApp());
}

class JeetoIndianApp extends StatefulWidget {
  const JeetoIndianApp({Key? key}) : super(key: key);

  @override
  State<JeetoIndianApp> createState() => _JeetoIndianAppState();
}

class _JeetoIndianAppState extends State<JeetoIndianApp> {
  String _currentScreen = "LOGIN"; // LOGIN, HOME, QUIZ, RESULT, LEADERBOARD
  String _activeCompetitionId = "";

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JeetoIndian',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        fontFamily: 'Roboto',
      ),
      home: _buildBody(),
    );
  }

  Widget _buildBody() {
    switch (_currentScreen) {
      case "LOGIN":
        return OtpLoginScreen(
          onLoginSuccess: () {
            setState(() => _currentScreen = "HOME");
          },
        );
      case "HOME":
        return HomeScreen(
          onSelectCompetition: (competitionId) {
            setState(() {
              _activeCompetitionId = competitionId;
              _currentScreen = "QUIZ";
            });
          },
          onViewLeaderboard: () {
            setState(() => _currentScreen = "LEADERBOARD");
          },
        );
      case "QUIZ":
        return QuizScreen(
          competitionId: _activeCompetitionId,
          onSubmitComplete: () {
            setState(() => _currentScreen = "RESULT");
          },
        );
      case "RESULT":
        return ResultScreen(
          onViewLeaderboard: () {
            setState(() => _currentScreen = "LEADERBOARD");
          },
          onBackToHome: () {
            setState(() => _currentScreen = "HOME");
          },
        );
      case "LEADERBOARD":
        return LeaderboardScreen(
          onBackToHome: () {
            setState(() => _currentScreen = "HOME");
          },
        );
      default:
        return const Scaffold(body: Center(child: Text("Screen Not Found")));
    }
  }
}
