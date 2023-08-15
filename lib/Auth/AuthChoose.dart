import 'package:flutter/material.dart';

class FirstPage extends StatefulWidget {
  const FirstPage({super.key});

  @override
  State<FirstPage> createState() => _FirstPageState();
}

class _FirstPageState extends State<FirstPage> {
  late bool chbox = false;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black12,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/Login');
              },
              child: Text('Login'),
            ),
            SizedBox(
              height: 25,
            ),
            ElevatedButton(
              onPressed: () {
                // Navigator.pushNamed(context, '/Register');
              },
              child: Text('Register'),
            ),
            SizedBox(
              height: 25,
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Checkbox(
                  value: chbox,
                  onChanged: (bool? value) {
                    setState(() {
                      chbox = value!;
                    });
                  },
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.pushNamed(context, '/Privacy Policy');
                  },
                  child: Text('I agree to the Privacy Policy'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
