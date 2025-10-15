import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conquistas } from './conquistas';

describe('Conquistas', () => {
  let component: Conquistas;
  let fixture: ComponentFixture<Conquistas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conquistas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Conquistas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
