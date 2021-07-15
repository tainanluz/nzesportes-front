import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../../../shared/services/auth.service';
import {AuthenticationRequest} from '../../../../shared/models/authentication-request.model';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  // @ts-ignore
  forgotPasswordForm: FormGroup;
  authenticationRequest: AuthenticationRequest = {
    username: '',
    password: ''
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.createForm();
  }


  private createForm(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  save(): void {
    console.log(this.forgotPasswordForm.value);
  }

  get validateFields(): any {
    return this.forgotPasswordForm.controls;
  }

  forgotMyPassword(): void {
    this.authenticationRequest.username = this.forgotPasswordForm?.get('email')?.value;
    this.authService.createFlow(this.authenticationRequest, 'recovery')
      .subscribe(response => {
        console.log(response);
      });
  }

}
