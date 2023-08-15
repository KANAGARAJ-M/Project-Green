import 'package:flutter/material.dart';
import 'package:green/Auth/AuthChoose.dart';
import 'package:green/Auth/Login/Login.dart';
import 'package:green/Auth/Register/Register.dart';
import 'package:green/PrivacyPolicy/privacypolicy.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Project Green',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      // home: const Text('Flutter Demo Home Page'),
      initialRoute: '/',
      routes: {
        '/': (context) => FirstPage(),
        // '/Login To Continue' :(context) => FirstPage(),
        '/Login': (context) => LoginScreen(),
        '/Register': (context) => RegisterScreen(),
        '/Privacy Policy': (context) => PrivacyPolicyPage(),
      },
    );
  }
}
